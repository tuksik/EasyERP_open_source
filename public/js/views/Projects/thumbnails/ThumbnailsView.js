﻿define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Projects/thumbnails/ThumbnailsItemTemplate.html',
    'views/thumbnailsViewBase',
    'views/Projects/EditView',
    'views/Projects/CreateView',
    'views/Filter/FilterView',
    'services/projects',
    'dataService',
    'common',
    'constants',
    'populate'
], function (Backbone, $, _, thumbnailsItemTemplate, BaseView, EditView, CreateView, FilterView, projects, dataService, common, CONSTANTS, populate) {
    'use strict';
    var ProjectThumbnalView = BaseView.extend({
        el           : '#content-holder',
        countPerPage : 0,
        template     : _.template(thumbnailsItemTemplate),
        newCollection: true,
        filter       : null,
        contentType  : 'Projects', // needs in view.prototype.changeLocationHash
        viewType     : 'thumbnails', // needs in view.prototype.changeLocationHash

        initialize: function (options) {
            $(document).off('click');

            this.EditView = EditView;
            this.CreateView = CreateView;

            this.asyncLoadImgs(this.collection);
            this.stages = [];

            BaseView.prototype.initialize.call(this, options);
        },

        events: {
            'click .health-wrapper .health-container': projects.showHealthDd,
            'click .health-wrapper ul li div'        : projects.chooseHealthDd,
            'click .newSelectList li'                : projects.chooseOption,
            'click .tasksByProject'                  : 'dropDown',
            'click .stageSelect'                     : projects.showNewSelect,
            'click .project'                         : 'useProjectFilter'
        },

        useProjectFilter: function (e) {
            var project = $(e.target).attr('id');
            var filter = {
                project: {
                    key  : 'project._id',
                    value: [project]
                }
            };

            e.preventDefault();

            Backbone.history.navigate('#easyErp/Tasks/list/p=1/c=100/filter=' + encodeURIComponent(JSON.stringify(filter)), {trigger: true});
        },

        hideHealth: projects.hideHealth,

        asyncLoadImgs: function (collection) {
            var arr = _.filter(collection.toJSON(), function (item) {
                return item.salesManager;
            });
            var ids = _.map(arr, function (item) {
                return item.salesManager._id;
            });

            common.getImages(ids, CONSTANTS.URLS.EMPLOYEES + 'getEmployeesImages');
        },

        gotoEditForm: function (e) {
            var id;

            e.preventDefault();
            App.ownContentType = true;
            id = $(e.target).closest('.thumbnail').attr('id');

            window.location.hash = '#easyErp/Projects/form/' + id;

            App.projectInfo = App.projectInfo || {};
            App.projectInfo.currentTab = 'overview';
        },

        deleteItems: function () {
            var mid = 39;
            var model = this.collection.get(this.$el.attr('id'));

            this.$el.fadeToggle(200, function () {
                model.destroy({
                    headers: {
                        mid: mid
                    }
                });
                $(this).remove();
            });

        },

        render: function () {
            var self = this;
            var $currentEl = this.$el;
            var createdInTag;

            $currentEl.html('');
            $currentEl.append(this.template({collection: this.collection.toJSON()}));

            self.renderFilter();

            common.populateWorkflowsList('Projects', '.filter-check-list', '', '/workflows', null, function (stages) {
                self.stages = stages || [];
            });

            populate.getPriority('#priority', this);

            createdInTag = '<div id="timeRecivingDataFromServer">Created in ' + (new Date() - this.startTime) + ' ms</div>';
            $currentEl.append(createdInTag);

            return this;
        }
    });

    return ProjectThumbnalView;
});
