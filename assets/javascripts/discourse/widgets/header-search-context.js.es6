import { searchContextDescription } from 'discourse/lib/search';
import { h } from 'virtual-dom';
import { createWidget } from 'discourse/widgets/widget';

createWidget('header-search-context', {
  tagName: 'div.header-search-context',

  html(attrs) {
    const service = this.container.lookup('search-service:main'),
          ctx = service.get('searchContext'),
          result = [];
    var className = 'btn'
    if (attrs.contextEnabled) { className = className.concat(' filter')}
    if (ctx) {
      const description = searchContextDescription(Ember.get(ctx, 'type'),
                                                   Ember.get(ctx, 'user.username') || Ember.get(ctx, 'category.name'));
      result.push(h('button', { className: className }, description));
    }

    result.push(this.attach('link', { action: 'showSearchHelp',
                                      label: 'show_help',
                                      className: 'show-help' }));
    result.push(h('div.clearfix'));
    return result;
  },

  click() {
    this.sendWidgetAction('searchContextChanged', !this.attrs.contextEnabled);
  }
});
