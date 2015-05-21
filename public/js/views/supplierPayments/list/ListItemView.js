/**
 * Created by soundstorm on 21.05.15.
 */
define([
        'text!templates/Payment/list/ListTemplate.html'
    ],

    function (PaymentListTemplate) {
        var ProductListItemView = Backbone.View.extend({
            el: '#listTable',

            initialize: function(options) {
                this.collection = options.collection;
                this.startNumber = (options.page - 1 ) * options.itemsNumber;//Counting the start index of list items
            },
            render: function() {
                this.$el.append(_.template(PaymentListTemplate, { paymentCollection: this.collection.toJSON(), startNumber: this.startNumber }));
            }
        });

        return ProductListItemView;
    });