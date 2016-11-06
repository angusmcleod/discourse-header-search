
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
        let headerWidth = this.$('.d-header .contents').width(),
            panelWidth = this.$('.d-header .panel').width(),
            titleWidth = this.$('.d-header .title a').width() + 560, // 560 is the width of the search input
            showHeaderSearch = headerWidth > (panelWidth + titleWidth + 50);

        const appController = this.container.lookup('controller:application'),
              currentState = appController.get('showHeaderSearch');

        appController.set('showHeaderSearch', showHeaderSearch)
        if (topicToggled || ((showHeaderSearch != currentState) || currentState === undefined)) {
          this.queueRerender()
          Ember.run.scheduleOnce('afterRender', () => {
            $('.d-header').toggleClass('header-search-enabled',
              !$('.search-menu').length && showHeaderSearch && !this._topic
            )
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
       //   return helper.attach('header-search', { contextEnabled: header.state.contextEnabled })
	   if (!helper.widget.site.mobileView) {
          const origin_code = helper.attach('header-search', { contextEnabled: header.state.contextEnabled });
          const nav_contents = h('div.topic-extra-info.header-links-wrapper.clearfix', [
            h('a.header-link', { attributes: { href: Discourse.getURL(`/categories`), title: '论坛最新' } }, '首页'),
            h('a.header-link', { attributes: { href: Discourse.getURL(`/c/vrdiscuss`), title: 'VR虚拟现实话题讨论' } }, '讨论区'),
            h('a.header-link', { attributes: { href: Discourse.getURL(`/c/vrdevices`), title: '各种VR设备信息及评测' } }, '设备区'),
            h('a.header-link', { attributes: { href: Discourse.getURL(`/c/resource`), title: '视频资源及游戏工具下载' } }, '资源区'),
            h('a.header-link.u-button', { attributes: { href: 'http://dmgeek.com/', title: '返回到盗梦极客主页', target: '_blank', onClick: 'window.open().location.href="http://dmgeek.com/"' } }, '盗梦主页')
          ]);
          // return helper.attach('header-search', { contextEnabled: header.state.contextEnabled })
          return [origin_code, nav_contents];
        } else {
          $('.d-header').removeClass('header-search-enabled')
  
        }
      })

      api.attachWidgetAction('home-logo', 'click', function(e) {
        if (wantsNewWindow(e)) { return false; }
        e.preventDefault();
        if (e.target.id === 'site-logo' || e.target.id === 'site-text-logo') {
          DiscourseURL.routeTo(this.href());
        }
        return false;
      })
    })
  }
}
