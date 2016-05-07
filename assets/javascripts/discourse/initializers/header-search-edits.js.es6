import ApplicationView from 'discourse/views/application';
import { withPluginApi } from 'discourse/lib/plugin-api';
import SiteHeader from 'discourse/components/site-header';
import { wantsNewWindow } from 'discourse/lib/intercept-click';
import DiscourseURL from 'discourse/lib/url';

export default {
  name: 'header-search',
  initialize(){

    withPluginApi('0.1', api => {
      api.decorateWidget('home-logo:after', function(helper) {
        const header = helper.widget.parentWidget,
              path = helper.container.lookup('controller:application').get('currentPath');
        if (!header.attrs.topic && path !== "full-page-search") {
          return helper.attach('header-search', { contextEnabled: header.state.contextEnabled })
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
