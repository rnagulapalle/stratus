(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([

      // Libraries
      'stratus',
      'underscore',
      'angular',

      // Modules
      'zxcvbn',
      'stratus.components.singleSignOn',
      'stratus.services.userAuthentication',
      'stratus.services.commonMethods',
      'stratus.directives.passwordCheck'
    ], factory);
  } else {
    // Browser globals
    factory(root.Stratus, root._, root.angular, root.zxcvbn);
  }
}(typeof self !== 'undefined' ? self : this, function (Stratus, _, angular, zxcvbn) {
  // This component intends to allow editing of various selections depending on context.
  Stratus.Components.UserAuthentication = {
    controller: function ($scope, $window, $attrs, userAuthentication, commonMethods) {
      // Initialize
      commonMethods.componentInitializer(this, $scope, $attrs, 'user_authentication', true);

      // variables
      var $ctrl = this;
      $ctrl.signinData = {};
      $ctrl.resetPassData = {};
      $ctrl.allowSubmit = false;
      $ctrl.loading = false;
      $ctrl.signInIndex = 0;
      $ctrl.signUpIndex = 1;
      $ctrl.emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/i;
      $ctrl.phoneRegex = /^[\d+\-().]+$/;
      $ctrl.enabledForgotPassForm = false;
      $ctrl.isHandlingUrl = commonMethods.getUrlParams().type !== null ? true : false;
      $ctrl.enabledResetPassForm = commonMethods.getUrlParams().type === 'reset-password' ? true : false;
      $ctrl.resetPassHeaderEmail = commonMethods.getUrlParams().type === 'reset-password' ? commonMethods.getUrlParams().email : null;
      $ctrl.enabledVerifyForm = commonMethods.getUrlParams().type === 'verify' ? true : false;
      $ctrl.forgotPassText = 'Forgot Password?';
      $ctrl.resetPassHeaderText = 'Reset your account password';
      $ctrl.changePassBtnText = 'Reset Password';
      $ctrl.selectedIndex = $ctrl.signInIndex;
      $ctrl.message = null;
      $ctrl.isRequestSuccess = false;

      // methods
      $ctrl.showForgotPassForm = showForgotPassForm;
      $ctrl.doSignIn = doSignIn;
      $ctrl.doSignUp = doSignUp;
      $ctrl.doRequestResetPass = doRequestResetPass;
      $ctrl.doResetPass = doResetPass;
      $ctrl.onTabSelected = onTabSelected;
      $ctrl.backToLogin = backToLogin;
      $ctrl.verifyAccount = verifyAccount;

      // Watcher for changing password
      $scope.$watch(angular.bind(this, function () {
        if (!_.isEmpty(this.signinData)) {
          return this.signinData.password;
        }
        if (!_.isEmpty(this.resetPassData)) {
          $ctrl.isRequestSuccess = false;
          return this.resetPassData.password;
        }
      }), function (newValue, oldValue) {
        if (newValue !== undefined && newValue !== oldValue) {
          $ctrl.progressBarClass = commonMethods.generateProgressBar(newValue).progressBarClass;
          $ctrl.progressBarValue = commonMethods.generateProgressBar(newValue).progressBarValue;

          if (newValue.length >= 8 && !commonMethods.validPassword(newValue)) {
            $ctrl.message = 'Your password must be at 8 or more characters and contain at least one lower and uppercase letter and one number.';
          } else {
            $ctrl.message = null;
            $ctrl.allowSubmit = true;
          }
        }
      });

      // Define functional methods
      function verifyAccount() {
        $ctrl.loading = true;
        var data = {
          type: 'verify',
          email: commonMethods.getUrlParams().email,
          token: commonMethods.getUrlParams().token
        };

        userAuthentication.verifyAccount(data).then(function (response) {
          $ctrl.loading = false;
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().verify) {
            $ctrl.message = commonMethods.getStatus(response).message;
            $ctrl.isRequestSuccess = true;
            $ctrl.enabledVerifyForm = false;
            $ctrl.enabledResetPassForm = true;
            $ctrl.resetPassHeaderText = 'Please set your password';
            $ctrl.changePassBtnText = 'Update password';
          } else {
            $ctrl.isRequestSuccess = false;
            $ctrl.message = commonMethods.getStatus(response).message;
          }
        });
      }

      function doSignIn(signinData) {
        $ctrl.loading = true;
        $ctrl.message = null;
        var data = {
          email: signinData.email,
          password: signinData.password
        };

        userAuthentication.signIn(data).then(function (response) {
          $ctrl.loading = false;
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
            return $window.location.href = '/';
          } else {
            $ctrl.isRequestSuccess = false;
            $ctrl.message = commonMethods.getStatus(response).message;
          }
        });
      }

      function doSignUp(signupData) {
        $ctrl.loading = true;
        $ctrl.message = null;
        var data = {
          email: signupData.email,
          phone: commonMethods.cleanedPhoneNumber(signupData.phone)
        };

        userAuthentication.signUp(data).then(function (response) {
          $ctrl.loading = false;
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
            return $window.location.href = '/';
          } else {
            $ctrl.isRequestSuccess = false;
            $ctrl.message = commonMethods.getStatus(response).message;
          }
        });
      }

      function doRequestResetPass(resetPassData) {
        $ctrl.loading = true;
        $ctrl.message = null;
        var data = {
          type: 'reset-password-request',
          email: resetPassData.email,
          phone: commonMethods.cleanedPhoneNumber(resetPassData.phone)
        };

        userAuthentication.requestResetPass(data).then(function (response) {
          $ctrl.loading = false;
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
            $ctrl.isRequestSuccess = true;
          } else {
            $ctrl.isRequestSuccess = false;
          }
          $ctrl.message = commonMethods.getStatus(response).message;
        });
      }

      function doResetPass(resetPassData) {
        $ctrl.loading = true;
        $ctrl.message = null;
        var requestType = commonMethods.getUrlParams().type === 'verify' ? 'update-password' : commonMethods.getUrlParams().type;
        var data = {
          type: requestType,
          email: commonMethods.getUrlParams().email,
          token: commonMethods.getUrlParams().token,
          password: resetPassData.password
        };

        userAuthentication.resetPass(data).then(function (response) {
          $ctrl.loading = false;
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
            $window.location.href = $window.location.origin + '/Member/Sign-In';
          } else {
            $ctrl.isRequestSuccess = false;
            $ctrl.message = commonMethods.getStatus(response).message;
          }
        });
      }

      // Helpers
      function showForgotPassForm(isShow) {
        $ctrl.message = null;
        $ctrl.forgotPassText = isShow ? 'Back to login' : 'Forgot Password?';
        $ctrl.enabledForgotPassForm = isShow;
        if (!isShow) {
          onTabSelected($ctrl.signInIndex);
        }
      };

      function backToLogin() {
        $ctrl.message = null;
        $ctrl.isHandlingUrl = false;
      };

      function onTabSelected(index) {
        $ctrl.selectedIndex = index;
        $ctrl.message = null;
      };
    },
    templateUrl: Stratus.BaseUrl + 'sitetheorystratus/stratus/components/userAuthentication' + (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  };
}));
