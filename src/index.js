function attach_annotation(bounds, exact, prefix, payload, data) {
  var wrap = require('wrap-range-text');
  var TextQuoteAnchor = require ('dom-anchor-text-quote');

  var tqa = new TextQuoteAnchor.default(document.body, exact, {'prefix':prefix});
  var range = tqa.toRange();

  var highlight = document.createElement('mark');
  highlight.id = 'hypothesis-' + data.id;
  highlight.setAttribute('data-hypothesis', JSON.stringify(data));
  highlight.title = payload;
  highlight.className = bounds + ' hypothesis_annotation';

  wrap(highlight, range);
}

function get_annotations(uri) {
  var url = 'https://hypothes.is/api/search?limit=200&uri=' + uri;

  var xhr = new XMLHttpRequest();
  xhr.addEventListener("load", function() {
    // TODO: needs error handling...
    attach_annotations(JSON.parse(xhr.responseText));
  });
  xhr.open("GET", url);
  xhr.send();
  return xhr;
}

function get_selector_with(selector_list, key) {
  for (var i=0; i<selector_list.length; i++) {
    if ( selector_list[i].hasOwnProperty(key) )
      return selector_list[i];
  }
}


function get_text_quote_selector(selector_list) {
  return get_selector_with(selector_list, 'exact');
}

function get_text_position_selector(selector_list) {
  return get_selector_with(selector_list, 'start');
}


function attach_annotations(data) {
  var rows = data['rows'];
  var anno_dict = {};

  for ( var i=0; i < rows.length; i++ ) {
    var row = rows[i];
    var user = row['user'].replace('acct:','').replace('@hypothes.is','');
    var selector_list = row['target'][0]['selector'];
    var text_quote_selector = get_text_quote_selector(selector_list);
    if ( text_quote_selector == null )
      continue;
    var exact = text_quote_selector['exact'];
    var prefix = text_quote_selector['prefix'];
    var text = row['text'];
    var tags = row['tags'].join(', ');
    payload = user + '\n\n' + tags + '\n\n' + text + '\n\n';
    anno = {
        "id":row['id'],
        "user":user,
        "exact":exact,
        "text":text,
        "prefix":prefix,
        "tags":tags
        }
    attach_annotation( '', exact, prefix, payload, anno );
    }

}

module.exports = get_annotations;
