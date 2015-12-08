import ApplicationView from 'discourse/views/application';

export default {
  name: 'hide-results-on-click',
  initialize(){

    ApplicationView.reopen({
      hideOnClick: function(e) {
        if (!$("#header-search-term").is(e.target)) {
          $(".results").hide();
        }
      }.on('mouseUp')
    });

  }
}
