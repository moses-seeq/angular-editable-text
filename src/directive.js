/**
 * Based on gg.editableText, originally created by Gabriel Grinberg on 6/13/14.
 */

(function() {
  'use strict';
  angular.module('gg.editableText').directive('ggEditableText', ggEditableText);

  function ggEditableText($rootScope, $q, $timeout, EditableTextHelper) {
    return {
      restrict: 'EA',
      scope: {
        editableText: '=ggEditableText',
        isEditing: '=ggIsEditing',
        placeholder: '@',
        onChange: '&ggOnChange'
      },
      transclude: true,
      template: '<span ng-class="{\'is-placeholder\': placeholder && !editingValue}" ng-style="{\'max-width\': \'inherit\'}" >' +
        '<input ng-show="isEditing" ng-blur="onInputBlur()" ng-keydown="onKeyPress($event)" ' +
          'ng-model="editingValue" placeholder="{{placeholder}}" type="text" ' +
          'pu-elastic-input pu-elastic-input-minwidth="auto" pu-elastic-input-maxwidth="100%" />' +
        '<div ng-hide="isEditing" ng-click="onInputFocus()">{{editingValue}}</div>' +
        '<span ng-hide="isEditing" ng-transclude></span>' +
        '<span ng-show="isWorking && EditableTextHelper.workingText.length" class="' + EditableTextHelper.workingClassName + '">' +
          EditableTextHelper.workingText + '</span>' +
        '</span>',
      link: link
    };

    function link(scope, elem, attrs) {
      var input, lastValue;

      activate();

      /**
       * Initialize the directive
       */
      function activate() {
        elem.addClass('gg-editable-text');

        input = elem.find('input')[0];
        scope.editingValue = scope.editableText;

        scope.$watch('isEditing', onIsEditing);
        scope.$watch('editableText', function(newVal) {
          lastValue = newVal;
          scope.editingValue = newVal;
          checkSelectAll();
        });
      }

      /**
       * Handler for 'focus' event from input field
       */
      scope.onInputFocus = function() {
        scope.isEditing = true;
        checkSelectAll();
      };

      /**
       * Handler for 'blur' event from input field
       */
      scope.onInputBlur = function() {
        scope.isEditing = false;
      };

      /**
       * Handler for 'keypress' event from input field
       * @param {Object} e - $event for keypress event
       */
      scope.onKeyPress = function(e) {
        if (e.which === 13) {
          // Enter/Return key
          $(input).blur();

          // If keep-focus attribute set, call onInputFocus again after processing the change
          if (attrs.hasOwnProperty('ggKeepFocus')) {
            $timeout(scope.onInputFocus, 20);
          }
        } else if (e.which === 27) {
          // Escape key
          scope.editingValue = scope.editableText;
          $(input).blur();
        }
      };

      /**
       * Select all text in input field if proper conditions exist
       */
      function checkSelectAll() {
        if (scope.isEditing && attrs.hasOwnProperty('ggSelectAll')) {
          input.setSelectionRange(0, scope.editingValue.length);
        }
      }

      /**
       * Process changes in/out of edit mode, calling onChange handler when isEditing transitions to false
       * @param {Boolean} isEditing - New value of isEditing
       * @param {Boolean} oldIsEditing - Previous value of isEditing
       */
      function onIsEditing(isEditing, oldIsEditing) {
        elem[isEditing ? 'addClass' : 'removeClass']('editing');
        if (isEditing) {

          input.focus();
          checkSelectAll();

        } else {
          if (attrs.hasOwnProperty('ggOnChange') && isEditing !== oldIsEditing && scope.editingValue !== lastValue) {
            scope.isWorking = true;

            // Wrap the return of onChange so that promises and values are treated the same.
            $q.when(scope.onChange({ value: scope.editingValue }))
              .then(
                function(value) {
                  if (typeof value !== 'undefined') {
                    scope.editingText = scope.editingValue = value;
                  }
                },

                function() {
                  scope.editingValue = scope.editableText;
                })
              .finally(function() {
                scope.isWorking = false;
                checkSelectAll();
              });
          } else {
            scope.editableText = scope.editingValue;
            checkSelectAll();
          }
        }
      }
    }
  }
})();
