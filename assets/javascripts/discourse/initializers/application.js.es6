import ApplicationView from 'discourse/views/application';
import ApplicationController from 'discourse/controllers/application';

export default {
  name: 'civil-topic',
  initialize(){

    ApplicationView.reopen({
      hideOnClick: function(e) {
        if (!$("#search-term").is(e.target)) {
          $(".results").hide();
        }
      }.on('mouseUp')
    });

  }
}
