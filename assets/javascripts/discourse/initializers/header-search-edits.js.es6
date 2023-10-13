import { withPluginApi } from 'discourse/lib/plugin-api';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import DiscourseURL from 'discourse/lib/url';
import { on } from "discourse-common/utils/decorators";

export default {
  name: 'header-search',
  initialize(container){

    const searchMenuWidget = container.factoryFor('widget:search-menu');
    const corePanelContents = searchMenuWidget.class.prototype['panelContents'];

    withPluginApi('0.8.9', api => {

      api.modifyClass('component:site-header', {
        toggleVisibility(topicToggled) {
          const headerWidth = $('.d-header .contents', this.element).width();
          const panelWidth = $('.d-header .panel', this.element).width();
          const logoWidth = $('.d-header .title a', this.element).width();

          const $searchHeader = $('<div class="search-header"/>').hide().appendTo("body");
          const searchWidth = parseInt($searchHeader.css("width"));
          $searchHeader.remove();

          const appController = api.container.lookup('controller:application');
          const currentState = appController.get('showHeaderSearch');
          const hideHeaderSearch = this.get('hideHeaderSearch');
          const showHeaderSearch = !hideHeaderSearch && (headerWidth > (panelWidth + logoWidth + searchWidth + 30)); // 30 is a buffer

          appController.set('showHeaderSearch', showHeaderSearch);
          if (topicToggled || ((showHeaderSearch !== currentState) || currentState === undefined)) {
            this.queueRerender();
            Ember.run.scheduleOnce('afterRender', () => {
              $('.d-header').toggleClass('header-search-enabled',
                !$('.panel > .search-menu').length && showHeaderSearch && !this._topic
              );
            });
          }
        },

        @on('didInsertElement')
        initSizeWatcher() {
          Ember.run.scheduleOnce('afterRender', () => {
            this.toggleVisibility();
          });
          $(window).on('resize', Ember.run.bind(this, this.toggleVisibility));
          this.appEvents.on('header:show-topic', () => this.toggleVisibility(true));
          this.appEvents.on('header:hide-topic', () => this.toggleVisibility(true));
        },

        @on('willDestroyElement')
        destroySizeWatcher() {
          $(window).off('resize', Ember.run.bind(this, this.toggleVisibility));
        }
      });

      api.reopenWidget('search-menu', {
        buildKey(attrs) {
          let type = attrs.formFactor || 'menu';
          return `search-${type}`;
        },

        defaultState(attrs) {
          return {
            formFactor: attrs.formFactor || 'menu',
            showHeaderResults: false
          };
        },

        buildClasses() {
          const formFactor = this.state.formFactor;
          const showHeaderResults = this.state.showHeaderResults;
          let classes = [`search-${formFactor}`];
          if (formFactor === 'header' && showHeaderResults) {
              classes.push('show-header-results');
          }
          return classes;
        },

        html() {
          if (this.state.formFactor === 'header') {
            return this.panelContents();
          } else {
            return this.attach('menu-panel', {
              maxWidth: 500,
              contents: () => this.panelContents()
            });
          }
        },

        clickOutside() {
          const formFactor = this.state.formFactor;

          if (formFactor === 'menu') {
            return this.sendWidgetAction('toggleSearchMenu');
          } else {
            this.state.showHeaderResults = false;
            this.scheduleRerender();
          }
        },

        click() {
          const formFactor = this.state.formFactor;
          if (formFactor === 'header') {
              this.showResults();
          }
        },

        showResults() {
          this.state.showHeaderResults = true;
          this.scheduleRerender();
        },

        linkClickedEvent() {
          const formFactor = this.state.formFactor;

          if (formFactor === 'header') {
            this.state.showHeaderResults = false;
            this.scheduleRerender();
          }
        },

        panelContents() {
          const formFactor = this.state.formFactor;
          let showHeaderResults = this.state.showHeaderResults == null || this.state.showHeaderResults === true;
          let contents = [];

          if (formFactor === 'header') {
            contents.push(this.attach('button', {
                icon: 'search',
                className: 'search-icon',
                action: 'showResults'
            }));
          }

          contents = contents.concat(...corePanelContents.call(this));

          if (formFactor === 'menu' || showHeaderResults) {
            return contents;
          } else {
            Ember.run.scheduleOnce('afterRender', this, () => {
              $('#search-term').val('');
            });

            return contents.filter((widget) => {
              return widget.name !== 'search-menu-results' && widget.name !== 'search-context';
            });
          }
        }
      });

      api.decorateWidget('home-logo:after', function(helper) {
        const header = helper.widget.parentWidget.parentWidget,
              appController = helper.register.lookup('controller:application'),
              showHeaderSearch = appController.get('showHeaderSearch'),
              searchMenuVisible = header.state.searchVisible;

        if (!searchMenuVisible && showHeaderSearch && !header.attrs.topic && !helper.widget.site.mobileView) {
          $('.d-header').addClass('header-search-enabled');

          return helper.attach('search-menu', {
            contextEnabled: header.state.contextEnabled,
            formFactor: 'header'
          });
        } else {
          $('.d-header').removeClass('header-search-enabled');
        }
      });

      api.reopenWidget('home-logo', {
        click(e) {
          if (wantsNewWindow(e)) return false;
          e.preventDefault();

          if (e.target.id === 'site-logo' || e.target.id === 'site-text-logo') {
            DiscourseURL.routeTo(this.href());
          }

          return false;
        }
      });
    });
  }
};
