define([
    'Backbone',
    'jQuery',
    'Underscore',
    'text!templates/Notes/AttachTemplate.html',
    'text!templates/Notes/AddAttachments.html',
    'moment',
    'constants'
], function (Backbone, $, _, AttachTemplate, addAttachTemplate, moment, CONSTANTS) {
    var AttachView = Backbone.View.extend({

        initialize: function (options) {
            this.contentType = options.contentType;
            this.isCreate = options.isCreate;
            this.elementId = options.elementId;
        },

        events: {
            'change .inputAttach': 'addAttach',
            'click .deleteAttach': 'deleteAttach'
        },

        template: _.template(AttachTemplate),

        addAttach: function (event) {
            var s;

            if (this.isCreate) {
                s = this.$el.find('.inputAttach:last').val().split('\\')[this.$el.find('.inputAttach:last').val().split('\\').length - 1];
                this.$el.find('.attachContainer').append('<li class="attachFile">' +
                    '<span class="blue">' + s + '</span>' +
                    '<a href="javascript:;" class="deleteAttach">Delete</a></li>'
                );
                this.$el.find('.attachContainer .attachFile:last').append(this.$el.find('.input-file .inputAttach').attr('hidden', 'hidden'));
                this.$el.find('.input-file').append('<input type="file" value="Choose File" class="inputAttach" name="attachfile">');
            } else {
                this.sendToServer(event, null, this);
            }
        },

        hideDialog: function () {
            $('.edit-dialog').remove();
            $('.add-group-dialog').remove();
            $('.add-user-dialog').remove();
        },

        sendToServer: function (event, model, self) {
            var currentModel = this.model;
            var elementId = this.elementId || 'addAttachments';
            var currentModelId = currentModel ? currentModel.id : null;
            var addFrmAttach = this.$el.find('#' + elementId);
            var fileArr = [];
            var addInptAttach;

            if (!self) {
                self = this;
            }

            if (this.isCreate) {
                currentModel = model;
                currentModelId = currentModel.id;

                this.$el.find('li .inputAttach').each(function () {
                    addInptAttach = $(this)[0].files[0];
                    fileArr.push(addInptAttach);

                    if (!self.fileSizeIsAcceptable(addInptAttach)) {
                        return App.render({
                            type   : 'error',
                            message: 'File you are trying to attach is too big. MaxFileSize: ' + App.File.MaxFileSizeDisplay
                        });
                    }
                });
                if (this.$el.find('li .inputAttach').length === 0) {

                    if (this.contentType === CONSTANTS.PRODUCTS) {
                        self.hideDialog();
                        return;
                    }

                    Backbone.history.fragment = '';
                    Backbone.history.navigate(window.location.hash, {trigger: true});

                    return;
                }
                addInptAttach = fileArr;
            } else {
                addInptAttach = addFrmAttach.find('#inputAttach')[0].files[0];

                if (!this.fileSizeIsAcceptable(addInptAttach)) {
                    this.$el.find('#inputAttach').val('');

                    return App.render({
                        type   : 'error',
                        message: 'File you are trying to attach is too big. MaxFileSize: ' + App.File.MaxFileSizeDisplay
                    });
                }
            }

            addFrmAttach.submit(function (e) {
                var bar = self.$el.find('.bar');
                var status = self.$el.find('.status');
                var contentType = self.contentType ? self.contentType.toLowerCase() : '';
                var formURL;

                $('.input-file-button').off('click');

                if (self.import) {
                    formURL = 'http://' + window.location.host + '/importFile';
                } else {
                    formURL = 'http://' + window.location.host + '/' + contentType + '/uploadFiles/';
                }

                e.preventDefault();
                addFrmAttach.ajaxSubmit({
                    url        : formURL,
                    type       : 'POST',
                    processData: false,
                    contentType: false,
                    data       : [addInptAttach],

                    beforeSend: function (xhr) {
                        var statusVal = '0%';

                        xhr.setRequestHeader('modelid', currentModelId);
                        xhr.setRequestHeader('modelname', self.contentType);
                        status.show();
                        bar.width(statusVal);
                        status.html(statusVal);
                    },

                    uploadProgress: function (event, position, total, statusComplete) {
                        var statusVal = statusComplete + '%';

                        bar.width(statusVal);
                        status.html(statusVal);
                    },

                    success: function (data) {
                        var res;
                        var attachments;

                        if (self.isCreate) {
                            status.hide();
                            self.hideDialog();

                            if (this.contentType === CONSTANTS.PRODUCTS) {
                                return;
                            }

                            Backbone.history.fragment = '';
                            Backbone.history.navigate(window.location.hash, {trigger: true});
                        } else if (self.import) {
                            Backbone.history.fragment = '';
                            Backbone.history.navigate(window.location.hash, {trigger: true});
                        } else {
                            attachments = currentModel.get('attachments') || [];
                            attachments.length = 0;
                            $('.attachContainer').empty();
                            res = (data.data) ? data.data : data.result;

                            if (!res) {
                                res = data;
                            }
                            res.attachments.forEach(function (item) {
                                var date = moment(item.uploadDate).format('DD MMM, YYYY, H:mm:ss');
                                attachments.push(item);
                                self.$el.find('.attachContainer').prepend(_.template(addAttachTemplate, {
                                    data: item,
                                    date: date
                                }));
                            });
                            addFrmAttach[0].reset();
                            status.hide();
                        }
                    },

                    error: function (xhr) {
                        $('.attachContainer').empty();
                        $('.bar .status').empty();
                        if (self) {
                            self.errorNotification(xhr);
                        }
                    }
                });
            });
            addFrmAttach.submit();
            addFrmAttach.off('submit');
        },

        fileSizeIsAcceptable: function (file) {
            if (!file) {
                return false;
            }
            return file.size < App.File.MAXSIZE;
        },

        deleteAttach: function (e) {
            var self = this;
            var $target = $(e.target);
            var currentModel = this.model;
            var attachments = currentModel.get('attachments');
            var newAttachments;
            var fileName;
            var id;

            if (confirm('You really want to remove this file?')) {
                $target = $(e.target);

                if ($target.closest('li').hasClass('attachFile')) {
                    $target.closest('.attachFile').remove();
                } else {
                    id = $target.attr('id');
                    newAttachments = _.filter(attachments, function (attach) {
                        if (attach._id !== id) {
                            return attach;
                        }
                    });

                    fileName = this.$el.find('.attachFile_' + id + ' a')[0].innerHTML;
                    currentModel.save({attachments: newAttachments, fileName: fileName},
                        {
                            headers: {
                                mid: 39
                            },
                            patch  : true, // Send only changed attr(add Roma)
                            success: function () {
                                self.$el.find('.attachFile_' + id).remove();
                            }
                        });
                }
            }
        },

        render: function () {
            var attachments = null;

            if (this.model && this.model.toJSON() && this.model.toJSON().attachments) {
                attachments = this.model.toJSON().attachments;
            }
            this.$el.html(this.template({
                attachments: attachments,
                elementId  : this.elementId || 'addAttachments',
                moment     : moment
            }));

            return this;
        }
    });

    return AttachView;
});
