import { createWidget } from 'discourse/widgets/widget';

createWidget('header-search-term', {
  tagName: 'input',
  buildId: () => 'header-search-term',

  buildAttributes(attrs) {
    return { type: 'text',
             value: attrs.value || '',
             placeholder: attrs.contextEnabled ? "" : I18n.t('search.title'),
             class: attrs.loading ? 'searching-background' : ''};
  },

  keyUp(e) {
    if (e.which === 13) {
      return this.sendWidgetAction('fullSearch');
    }

    const val = this.attrs.value;
    const newVal = $(`#${this.buildId()}`).val();

    if (newVal !== val) {
      this.sendWidgetAction('searchTermChanged', newVal);
    }
  },

  click() {
    this.sendWidgetAction('toggleResults', true);
  }
});
