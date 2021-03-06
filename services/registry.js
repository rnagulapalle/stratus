// Registry Service
// ----------------

/* global define */

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([
      'stratus',
      'underscore',
      'angular',
      'stratus.services.collection',
      'stratus.services.model'
    ], factory)
  } else {
    factory(root.Stratus, root._, root.angular)
  }
}(this, function (Stratus, _, angular) {
  // This Collection Service handles data binding for multiple objects with the
  // $http Service
  // TODO: Build out the query-only structure here as a separate set of
  // registered collections and models
  Stratus.Services.Registry = [
    '$provide',
    function ($provide) {
      $provide.factory('Registry', [
        'Collection',
        'Model',
        '$interpolate',
        '$q',
        function (Collection, Model, $interpolate, $q) {
          return function () {
            // TODO: Handle Version Routing through Angular
            // Maintain all models in Namespace
            // Inverse the parent and child objects the same way Doctrine does
            /**
             * @param $element
             * @param $scope
             * @returns $q
             */
            this.fetch = function ($element, $scope) {
              var that = this
              return new $q(function (resolve, reject) {
                if (angular.isString($element)) {
                  $element = {
                    target: $element
                  }
                }
                var options = {
                  target: $element.attr
                    ? $element.attr('data-target')
                    : $element.target,
                  targetSuffix: $element.attr
                    ? $element.attr('data-target-suffix')
                    : $element.targetSuffix,
                  id: $element.attr ? $element.attr('data-id') : $element.id,
                  manifest: $element.attr
                    ? $element.attr('data-manifest')
                    : $element.manifest,
                  decouple: $element.attr
                    ? $element.attr('data-decouple')
                    : $element.decouple,
                  direct: $element.attr
                    ? $element.attr('data-direct')
                    : $element.direct,
                  api: $element.attr ? $element.attr('data-api') : $element.api,
                  urlRoot: $element.attr ? $element.attr('data-url-root') : $element.urlRoot
                }
                var completed = 0
                $scope.$watch(function () {
                  return completed
                }, function (iteration) {
                  if (_.isNumber(iteration) &&
                    parseInt(iteration) === _.size(options)) {
                    resolve(that.build(options, $scope))
                  }
                })
                _.each(options, function (element, key) {
                  if (element && angular.isString(element)) {
                    var interpreter = $interpolate(element, false, null, true)
                    var initial = interpreter($scope.$parent)
                    if (angular.isDefined(initial)) {
                      options[key] = initial
                      completed++
                    } else {
                      $scope.$watch(function () {
                        return interpreter($scope.$parent)
                      }, function (value) {
                        if (value) {
                          options[key] = value
                          completed++
                        }
                      })
                    }
                  } else {
                    completed++
                  }
                })
              })
            }
            /**
             * @returns {collection|model|*}
             */
            this.build = function (options, $scope) {
              var data
              if (options.target) {
                options.target = _.ucfirst(options.target)

                // Find or Create Reference
                if (options.manifest || options.id) {
                  if (!Stratus.Catalog[options.target]) {
                    Stratus.Catalog[options.target] = {}
                  }
                  var id = options.id || 'manifest'
                  if (options.decouple ||
                    !Stratus.Catalog[options.target][id]) {
                    var modelOptions = {
                      target: options.target,
                      manifest: options.manifest,
                      stagger: true
                    }
                    if (options.urlRoot) {
                      modelOptions.urlRoot = options.urlRoot
                    }
                    if (options.targetSuffix) {
                      modelOptions.targetSuffix = options.targetSuffix
                    }
                    data = new Model(modelOptions, {
                      id: options.id
                    })
                    if (!options.decouple) {
                      Stratus.Catalog[options.target][id] = data
                    }
                  } else if (Stratus.Catalog[options.target][id]) {
                    data = Stratus.Catalog[options.target][id]
                  }
                } else {
                  var registry = !options.direct ? 'Catalog' : 'Compendium'
                  if (!Stratus[registry][options.target]) {
                    Stratus[registry][options.target] = {}
                  }
                  if (options.decouple ||
                    !Stratus[registry][options.target].collection) {
                    var collectionOptions = {
                      target: options.target,
                      direct: !!options.direct
                    }
                    if (options.urlRoot) {
                      collectionOptions.urlRoot = options.urlRoot
                    }
                    if (options.targetSuffix) {
                      collectionOptions.targetSuffix = options.targetSuffix
                    }
                    data = new Collection(collectionOptions)
                    if (!options.decouple) {
                      Stratus[registry][options.target].collection = data
                    }
                  } else if (Stratus[registry][options.target].collection) {
                    data = Stratus[registry][options.target].collection
                  }
                }

                // Filter if Necessary
                if (options.api) {
                  data.meta.set('api', _.isJSON(options.api)
                    ? JSON.parse(options.api)
                    : options.api)
                }

                // Handle Staggered
                if (data.stagger && typeof data.initialize === 'function') {
                  data.initialize()
                }
              }

              // Evaluate
              if (angular.isObject(data)) {
                if (typeof $scope !== 'undefined') {
                  $scope.data = data
                  if (data instanceof Model) {
                    $scope.model = data
                  } else if (data instanceof Collection) {
                    $scope.collection = data
                  }
                }
                if (!data.pending && !data.completed) {
                  data.fetch()
                }
              }
              return data
            }
          }
        }
      ])
    }
  ]
}))
