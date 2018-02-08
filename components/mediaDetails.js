// Media Library Component
// -----------------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([

      // Libraries
      'stratus',
      'jquery',
      'underscore',
      'angular',

      // Modules
      'angular-material',
      'stratus.services.media'
    ], factory);
  } else {
    factory(root.Stratus, root._);
  }
}(this, function (Stratus, _) {

  // This component intends to handle binding of an
  // item array into a particular attribute.
  Stratus.Components.MediaDetails = {
    bindings: {
      ngModel: '=',
      media: '<',
      collection: '<'
    },
    controller: function ($scope, $mdDialog, $attrs, commonMethods, media) {
      // Initialize
      commonMethods.componentInitializer(this, $scope, $attrs, 'media_details', true);
      var $ctrl = this;

      $ctrl.$onInit = function () {
        // Variables
        $ctrl.mediaUrl = 'http://' + $ctrl.media.data.prefix + '.' + $ctrl.media.data.extension;
        $ctrl.tags = $ctrl.media.data.tags;
        $ctrl.infoId = $ctrl.media.data.id;
        $ctrl.selectedName = {
          name: $ctrl.media.data.name,
          editing: false
        };
        $ctrl.selectedDesc = {
          description: $ctrl.media.data.description,
          editing: false
        };

        // Methods
        $ctrl.deleteMedia = deleteMedia;
        $ctrl.getLinkMedia = getLinkMedia;
        $ctrl.closeDialog = closeDialog;
        $ctrl.openUploader = openUploader;
        $ctrl.createTag = createTag;
        $ctrl.editItem = editItem;
        $ctrl.doneEditing = doneEditing;
        $ctrl.searchFilter = searchFilter;
      };

      function deleteMedia() {
        var fileId = $ctrl.media.data.id;
        if (!Stratus.Environment.get('production')) {
          console.log(fileId);
        }

        $mdDialog.show(
          $mdDialog.confirm()
          .title('DELETE MEDIA')
          .textContent('Are you sure you want to permanently delete this from your library? You may get broken images if any content still uses this image.')
          .multiple(true)
          .ok('Yes')
          .cancel('No')
        ).then(function () {
          media.deleteMedia(fileId).then(
            function (response) {
              if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
                $mdDialog.cancel();
                media.getMedia($ctrl);
              } else {
                $mdDialog.show(
                  $mdDialog.alert()
                  .parent(angular.element(document.querySelector('#popupContainer')))
                  .clickOutsideToClose(false)
                  .title('Error')
                  .multiple(true)
                  .textContent(commonMethods.getStatus(response).message)
                  .ok('Ok')
                );
              }
            },
            function (rejection) {
              if (!Stratus.Environment.get('production')) {
                console.log(rejection);
              }
            });
        });
      };

      function getLinkMedia() {
        if (commonMethods.copyToClipboard($ctrl.mediaUrl)) {
          $mdDialog.show(
            $mdDialog.confirm()
            .textContent('Link is copied to clipboard')
            .multiple(true)
            .ok('OK')
          );
        }
      };

      function closeDialog() {
        $mdDialog.cancel();
      };

      // Open the uploader to replace image
      function openUploader(ngfMultiple, fileId) {
        media.openUploader($ctrl, ngfMultiple, fileId, $scope);
      }

      $scope.$on('uploadSuccess', function (event, files) {
        console.log(files);
        if (!files[0].errorUpload) {
          $ctrl.mediaUrl = files[0].result.url;
        }
      });

      function createTag(query, fileId, tags) {
        var data = { name: query };
        media.createTag(data).then(function (response) {
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
            if (fileId !== undefined && tags !== undefined) {
              var dataRes = {};
              $ctrl.tags.push(response.data.payload);
              dataRes.tags = $ctrl.tags;
              updateMedia(fileId, dataRes);
            }
          }
        });
      };

      // Update title, description, tags of a file
      function updateMedia(fileId, data) {
        media.updateMedia(fileId, data).then(function (response) {
          if (commonMethods.getStatus(response).code == commonMethods.RESPONSE_CODE().success) {
            media.getMedia($ctrl);
          }
        });
      };

      // Handle click event for editing title & description
      function editItem(item) {
        item.editing = true;
      };

      // Handle updating title & description
      function doneEditing(fileId, item) {
        var data = {};
        if (item.description) {
          data.description = item.description;
        }
        if (item.name) {
          data.name = item.name;
        }

        item.editing = false;
        updateMedia(fileId, data);
      };

      function searchFilter(query) {
        return $ctrl.collection.filter(query);
      }

      // Handle saving tags after updating
      $scope.$watch('$ctrl.tags', function (data) {
        if ($ctrl.infoId !== undefined) {
          var dataRes = {};
          dataRes.tags = $ctrl.tags;
          media.updateMedia($ctrl.infoId, dataRes).then(
            function (response) {
              media.getMedia($ctrl);
            },
            function (rejection) {
              if (!Stratus.Environment.get('production')) {
                console.log(rejection);
              }
            });
        }
      }, true);
    },
    templateUrl: Stratus.BaseUrl + 'sitetheorystratus/stratus/components/mediaDetails' + (Stratus.Environment.get('production') ? '.min' : '') + '.html'
  };
}));
