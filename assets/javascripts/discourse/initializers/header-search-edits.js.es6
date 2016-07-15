
import { withPluginApi } from 'discourse/lib/plugin-api';
import SiteHeader from 'discourse/components/site-header';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import DiscourseURL from 'discourse/lib/url';
import { h } from 'virtual-dom';

export default {
  name: 'header-search',
  initialize(){

    withPluginApi('0.1', api => {
      api.decorateWidget('home-logo:after', function(helper) {
        const header = helper.widget.parentWidget,
              path = helper.container.lookup('controller:application').get('currentPath');
        if (!header.attrs.topic && path !== "full-page-search" && !helper.widget.site.mobileView) {
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
