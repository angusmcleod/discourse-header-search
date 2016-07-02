import ApplicationView from 'discourse/views/application';
import { withPluginApi } from 'discourse/lib/plugin-api';
import SiteHeader from 'discourse/components/site-header';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import DiscourseURL from 'discourse/lib/url';
import { default as computed, on, observes } from 'ember-addons/ember-computed-decorators';

export default {
  name: 'header-search',
  initialize(){

    SiteHeader.reopen({
      toggleHeaderSearch(topicToggled) {
        var headerWidth = this.$('.d-header .contents').width(),
            panelWidth = this.$('.d-header .panel').width(),
            titleWidth = 730;
        const appController = this.container.lookup('controller:application')
        var showHeaderSearch = Boolean(headerWidth > (panelWidth + titleWidth + 50)),
            currentState = appController.get('showHeaderSearch');
        appController.set('showHeaderSearch', showHeaderSearch)
        if (topicToggled || ((showHeaderSearch != currentState) || currentState === undefined)) {
          this.queueRerender()
          Ember.run.scheduleOnce('afterRender', () => {
            if (!$('.search-menu').length && showHeaderSearch && !this._topic) {
              $('.d-header').addClass('header-search-enabled')
            } else {
              $('.d-header').removeClass('header-search-enabled')
            }
          })
        }
      },

      @on('didInsertElement')
      initSizeWatcher() {
        Ember.run.scheduleOnce('afterRender', () => {
          this.toggleHeaderSearch()
        })
        $(window).on('resize', Ember.run.bind(this, this.toggleHeaderSearch))
        this.appEvents.on('header:show-topic', () => this.toggleHeaderSearch(true))
        this.appEvents.on('header:hide-topic', () => this.toggleHeaderSearch(true))
      },

      @on('willDestroyElement')
      destroySizeWatcher() {
        $(window).off('resize', Ember.run.bind(this, this.toggleHeaderSearch))
      }
    })

    withPluginApi('0.1', api => {
      api.decorateWidget('home-logo:after', function(helper) {
        const header = helper.widget.parentWidget,
              appController = helper.container.lookup('controller:application'),
              path = appController.get('currentPath'),
              showHeaderSearch = appController.get('showHeaderSearch'),
              searchVisible = header.state.searchVisible;

        if (!searchVisible && showHeaderSearch && !header.attrs.topic && path !== "full-page-search" && !helper.widget.site.mobileView) {
          $('.d-header').addClass('header-search-enabled')
          return helper.attach('header-search', { contextEnabled: header.state.contextEnabled })
        } else {
          $('.d-header').removeClass('header-search-enabled')
        }
      })

      api.attachWidgetAction('home-logo', 'click', function(e) {
        if (wantsNewWindow(e)) { return false; }
        e.preventDefault();
        if (e.target.id === 'site-logo') {
          DiscourseURL.routeTo(this.href());
        }
        return false;
      })
    })
  }
}
