/* global define */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      'stratus',
      'underscore',
      'angular'
    ], factory)
  } else {
    factory(root.Stratus, root._, root.angular)
  }
}(this, function (Stratus, _, angular) {
  Stratus.Controllers.SelectMainRoute = [
    '$scope',
    '$mdDialog',
    '$location',
    function ($scope, $mdDialog, $location) {
      // Store Instance
      Stratus.Instances[_.uniqueId('select_main_route_')] = $scope

      // Wrappers
      $scope.Stratus = Stratus
      $scope._ = _

      // list route is got from server;
      $scope.routes = []
      $scope.routeEmptyMessage = false
      $scope.routeUniqueMessage = false
      $scope.routeRegularEmpMessage = false
      $scope.selectedId = 0
      // the id of main route
      $scope.mainRoute = 0
      $scope.setAsHomePage = function (model, $event) {
        var confirm = $mdDialog.confirm()
          .title('Set As Home Page')
          .textContent("Are you sure you want to set this current page as your main home page ?   If you confirm, then all traffic to your main domain will load this page. Please also remember that if your current home page does not have a secondary friendly URL, the system will create a temporary URL for it (which you may want to change). And there may not be a way to access that page if it's not linked from your menu.")
          .targetEvent($event)
          .ok('Confirm')
          .cancel('Cancel')
        $mdDialog.show(confirm).then(function () {
          model.data.main = true
          model.save()
          model.data.routing.push({ 'homePage': true })
        }, function () {
          return false
        })
      }

      // Data Connectivity
      $scope.$watch('model.data', function (routings) {
        if (routings.routing) {
          var count = 1
          var resetRouting = []
          for (var i = 0; i < routings.routing.length; i++) {
            if (routings.routing[i] && routings.routing[i].main === true) {
              resetRouting[0] = routings.routing[i]
            } else {
              resetRouting[count] = routings.routing[i]
              count++
            }
          }
          routings.routing = resetRouting
          $scope.routes = routings.routing
          angular.forEach($scope.routes, function (route) {
            if (route.main) {
              $scope.mainRoute = route.id
            }
          })
        }
      })
      $scope.update = function (model) {
        angular.forEach($scope.routes, function (route) {
          route.main = (route.id === $scope.mainRoute)
        })
        return $scope.routes
      }
      $scope.removeEmptyRoute = function (model, $event, $index) {
        var alias = ''
        if (model.data.routing[$index] !== undefined && model.data.routing[$index].url && model.data.routing[$index].url !== undefined) {
          alias = model.data.routing[$index].url
        }
        var confirm = $mdDialog.confirm()
          .title('Delete Route')
          .textContent("Are you sure you want to remove the friendly URL alias  '/" + alias + "'  from this page? ")
          .targetEvent($event)
          .ok('Confirm')
          .cancel('Cancel')
        $mdDialog.show(confirm).then(function () {
          $scope.routeMessage = false
          model.data.routing.splice($index, 1)
        }, function () {
          return false
        })
      }
      /* Validation of urls */
      $scope.checkEmptyRoute = function (model, $event) {
        var lastUrl = $event.$parent.route.url
        var isMain = model.data.main
        if (lastUrl === '' && isMain === true) {
          $scope.routeEmptyMessage = true
        } else {
          $scope.routeEmptyMessage = false
          var uniqueValidation = $scope.checkUniqueRoute(model, $event)
          if (uniqueValidation === true) {
            $scope.routeEmptyMessage = true
            $scope.selectedId = $event.$parent.route.uid
          } else {
            $scope.routeEmptyMessage = false
            $scope.selectedId = $event.$parent.route.uid
            var patternValidation = $scope.checkPattern($event)
            if (patternValidation === true) {
              $scope.routeRegularEmpMessage = true
              $scope.selectedIds = $event.$parent.route.uid
            } else {
              $scope.routeRegularEmpMessage = false
              $scope.selectedIds = $event.$parent.route.uid
            }
          }
        }
      }
      $scope.checkUniqueRoute = function (model, $event) {
        var valueArr = model.data.routing.map(function (item) { return item.url })
        var isDuplicate = valueArr.some(function (item, idx) {
          if (valueArr.indexOf(item) !== idx) {
            $scope.selectedIds = $event.$parent.route.uid
          }
          return valueArr.indexOf(item) !== idx
        })
        return isDuplicate
      }
      $scope.checkPattern = function ($event) {
        var patt = /^([a-z0-9]+)([a-z0-9\_\/\~\.\-])*([a-z0-9]+)$/i // eslint-disable-line
        if (patt.test($event.$parent.route.url)) {
          return false
        } else {
          return true
        }
      }
    }]
}))
