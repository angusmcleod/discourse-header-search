import {searchForTerm, searchContextDescription} from 'discourse/lib/search';
import DiscourseURL from 'discourse/lib/url';
import { default as computed, observes, on } from 'ember-addons/ember-computed-decorators';
import showModal from 'discourse/lib/show-modal';

let _dontSearch = false;
export default Ember.Component.extend({
  searchService: Ember.inject.service('search'),
  classNames: ['header-search'],
  typeFilter: null,
  showHeaderSearch: false,

  @on('didInsertElement')
  @observes('currentPath')
  hideWhenFullPageSearch: function() {
    this.toggleHeaderSearch(this.get('currentPath') !== "full-page-search")
  },

  @on('didInsertElement')
  @observes('showExtraInfo')
  hideWhenExtraInfo: function() {
    this.toggleHeaderSearch(!this.get('showExtraInfo'))
  },

  @on('willClearRender')
  removeWindowResize: function() {
    this.toggleResizeEvent(false)
  },

  toggleHeaderSearch: function(showSearch) {
    this.toggleSearchUI(showSearch)
    this.toggleResizeEvent(showSearch)
  },

  toggleSearchUI: function(showHeaderSearch) {
    if (showHeaderSearch) {
      if (this.siteSettings.override_extra_info) {
        Ember.run.scheduleOnce('afterRender', this, function() {
          $('.extra-info-wrapper').hide()
        });
      }
      this.set('searchVisible', false)
      $('#search-button').hide()
      this.set('showHeaderSearch', true)
      Ember.run.scheduleOnce('afterRender', this, this.handleResize)
    } else {
      $(".results").hide()
      this.set('searchService.term', null)
      this.set('showHeaderSearch', false)
      $('#search-button').show()
    }
  },

  toggleResizeEvent: function(attachResizeEvent) {
    if (attachResizeEvent) {
      $(window).on('resize.headerResize', Ember.run.bind(this, function(){
        Ember.run.throttle(this, this.handleResize, 200)
      }))
    } else {
      $(window).off('resize.headerResize')
    }
  },

  handleResize: function() {
    var searchShowing = this.get('showHeaderSearch');
    if ($('.d-header > .wrap').width() > 900) {
      if (!searchShowing) {this.toggleSearchUI(true)}
    } else {
      if (searchShowing) {this.toggleSearchUI(false)}
    }
  },

  @observes('searchService.searchContext')
  contextChanged: function() {
    if (this.get('searchService.searchContextEnabled')) {
      _dontSearch = true;
      this.set('searchService.searchContextEnabled', false);
      _dontSearch = false;
    }
  },

  @observes('loading')
  searchingBackground: function() {
    if (this.get('loading'))
      $('#header-search-term').addClass('searching-background')
    else
      $('#header-search-term').removeClass('searching-background')
  },

  @computed('searchService.searchContext', 'searchService.term', 'searchService.searchContextEnabled')
  fullSearchUrlRelative(searchContext, term, searchContextEnabled) {

    if (searchContextEnabled && Ember.get(searchContext, 'type') === 'topic') {
      return null;
    }

    let url = '/search?q=' + encodeURIComponent(this.get('searchService.term'));
    if (searchContextEnabled) {
      if (searchContext.id.toString().toLowerCase() === this.get('currentUser.username_lower') &&
          searchContext.type === "private_messages"
          ) {
        url += ' in:private';
      } else {
        url += encodeURIComponent(" " + searchContext.type + ":" + searchContext.id);
      }
    }

    return url;
  },

  @computed('fullSearchUrlRelative')
  fullSearchUrl(fullSearchUrlRelative) {
    if (fullSearchUrlRelative) {
      return Discourse.getURL(fullSearchUrlRelative);
    }
  },

  @computed('searchService.searchContext')
  searchContextDescription(ctx) {
    if (ctx) {
      switch(Em.get(ctx, 'type')) {
        case 'topic':
          return I18n.t('search.context.topic');
        case 'user':
          return I18n.t('search.context.user', {username: Em.get(ctx, 'user.username')});
        case 'category':
          return I18n.t('search.context.category', {category: Em.get(ctx, 'category.name')});
        case 'private_messages':
          return I18n.t('search.context.private_messages');
      }
    }
  },

  @observes('searchService.searchContextEnabled')
  searchContextEnabledChanged() {
    if (_dontSearch) { return; }
    this.newSearchNeeded();
  },

  // If we need to perform another search
  @observes('searchService.term', 'typeFilter')
  newSearchNeeded() {
    this.set('noResults', false);
    const term = (this.get('searchService.term') || '').trim();
    if (term.length >= Discourse.SiteSettings.min_search_term_length) {
      this.set('loading', true);
      Ember.run.debounce(this, 'searchTerm', term, this.get('typeFilter'), 400);
    } else {
      this.setProperties({ content: null });
    }
    this.set('selectedIndex', 0);
  },

  searchTerm(term, typeFilter) {
    // for cancelling debounced search
    if (this._cancelSearch){
      this._cancelSearch = null;
      return;
    }

    if (this._search) {
      this._search.abort();
    }

    const searchContext = this.get('searchService.searchContextEnabled') ? this.get('searchService.searchContext') : null;
    this._search = searchForTerm(term, { typeFilter, searchContext, fullSearchUrl: this.get('fullSearchUrl') });

    this._search.then((content) => {
      this.setProperties({ noResults: !content, content });
    }).finally(() => {
      this.set('loading', false);
      this._search = null;
    });
  },

  @computed('typeFilter', 'loading')
  showCancelFilter(typeFilter, loading) {
    if (loading) { return false; }
    return !Ember.isEmpty(typeFilter);
  },

  @observes('searchService.term')
  termChanged() {
    this.cancelTypeFilter();
  },

  actions: {
    fullSearch() {
      const self = this;

      if (this._search) {
        this._search.abort();
      }

      // maybe we are debounced and delayed
      // stop that as well
      this._cancelSearch = true;
      Em.run.later(function() {
        self._cancelSearch = false;
      }, 400);

      const url = this.get('fullSearchUrlRelative');
      if (url) {
        DiscourseURL.routeTo(url);
      }
    },

    moreOfType(type) {
      this.set('typeFilter', type);
    },

    cancelType() {
      this.cancelTypeFilter();
    },

    showedSearch() {
      $('#header-search-term').focus();
    },

    showSearchHelp() {
      // TODO: @EvitTrout how do we get a loading indicator here?
      Discourse.ajax("/static/search_help.html", { dataType: 'html' }).then((model) => {
        showModal('searchHelp', { model });
      });
    },

    cancelHighlight() {
      this.set('searchService.highlightTerm', null);
    },

    toggleContext() {
      this.toggleProperty('searchService.searchContextEnabled')
    }

  },

  cancelTypeFilter() {
    this.set('typeFilter', null);
  },

  keyDown(e) {
    const term = this.get('searchService.term');
    if (e.which === 13 && term && term.length >= this.siteSettings.min_search_term_length) {
      $('.search-context').hide();
      $(".results").hide();
      this.send('fullSearch');
    }
  }
});
