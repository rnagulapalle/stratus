//     Stratus.Directives.Src.js 1.0

//     Copyright (c) 2016 by Sitetheory, All Rights Reserved
//
//     All information contained herein is, and remains the
//     property of Sitetheory and its suppliers, if any.
//     The intellectual and technical concepts contained herein
//     are proprietary to Sitetheory and its suppliers and may be
//     covered by U.S. and Foreign Patents, patents in process,
//     and are protected by trade secret or copyright law.
//     Dissemination of this information or reproduction of this
//     material is strictly forbidden unless prior written
//     permission is obtained from Sitetheory.
//
//     For full details and documentation:
//     http://docs.sitetheory.io

// Stratus Src Directive
// ----------------------

// Define AMD, Require.js, or Contextual Scope
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['stratus', 'underscore', 'angular'], factory);
    } else {
        factory(root.Stratus, root._);
    }
}(this, function (Stratus, _) {
    // This directive intends to handle binding of a dynamic variable to
    Stratus.Directives.Src = function ($parse, $interpolate) {
        return {
            restrict: 'A',
            scope: {
                stratusSrc: '@stratusSrc'
            },
            link: function ($scope, $element, $attrs) {
                Stratus.Instances[_.uniqueId('src_')] = $scope;

                // Group Registration
                $scope.registered = false;
                $scope.register = function () {
                    if ($scope.registered) return true;
                    $scope.registered = true;
                    $element.attr('data-src', 'lazy');  // This is here for CSS backwards compatibility
                    Stratus.RegisterGroup.add('OnScroll', {
                        method: Stratus.Internals.LoadImage,
                        el: $element,
                        spy: $element.data('spy') ? Stratus($element.data('spy')) : $element
                    });
                    Stratus.Internals.OnScroll();
                };

                // Source Interpolation
                $scope.src = $attrs.stratusSrc || $element.attr('src');
                $scope.interpreter = $interpolate($scope.src, false, null, true);
                $scope.initial = $scope.interpreter($scope.$parent);
                if (angular.isDefined($scope.initial)) {
                    $element.attr('src', $scope.initial);
                    $scope.register();
                } else {
                    $scope.$watch(function () {
                        return $scope.interpreter($scope.$parent);
                    }, function (value) {
                        if (angular.isDefined(value)) {
                            $element.attr('src', value);
                            $scope.register();
                        }
                    });
                }
            }
        };
    };
}));
