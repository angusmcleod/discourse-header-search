import { withPluginApi } from 'discourse/lib/plugin-api';
import SiteHeader from 'discourse/components/site-header';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import DiscourseURL from 'discourse/lib/url';
import { on } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'header-search',
  initialize(container){

    SiteHeader.reopen({
      toggleVisibility(topicToggled) {
        let headerWidth = this.$('.d-header .contents').width(),
            panelWidth = this.$('.d-header .panel').width(),
            titleWidth = this.$('.d-header .title a').width() + 560, // 560 is the width of the search input
            showHeaderSearch = headerWidth > (panelWidth + titleWidth + 50); // 50 is a buffer

        const appController = container.lookup('controller:application'),
              currentState = appController.get('showHeaderSearch');

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

    const searchMenuWidget = container.factoryFor('widget:search-menu');
    const corePanelContents = searchMenuWidget.class.prototype['panelContents'];

    withPluginApi('0.8.9', api => {
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
          return [`search-${this.state.formFactor}`];
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
            this.state.showHeaderResults = true;
            this.scheduleRerender();
          }
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
          let showHeaderResults = this.state.showHeaderResults == null ||
                                  this.state.showHeaderResults === true;

          if (formFactor === 'menu' || showHeaderResults) {
            return corePanelContents.call(this);
          } else {
            let contents = corePanelContents.call(this);

            Ember.run.scheduleOnce('afterRender', this, () => {
              $('#search-term').val('');
            });

            return contents.filter((widget) => {
              return widget.name !== 'search-menu-results';
            });
          }
        }
      });

      api.decorateWidget('home-logo:after', function(helper) {
        const header = helper.widget.parentWidget,
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

      api.reopenWidget('home-logo', 'click', function(e) {
        if (wantsNewWindow(e)) return false;
        e.preventDefault();

        if (e.target.id === 'site-logo' || e.target.id === 'site-text-logo') {
          DiscourseURL.routeTo(this.href());
        }

        return false;
      });
    });
  }
};
