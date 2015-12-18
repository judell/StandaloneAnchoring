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

  // extract annotations into a position-keyed object
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
    var text_position_selector = get_text_position_selector(selector_list);
    if ( text_position_selector == null )
      continue;
    var position = text_position_selector['start'] + '_' + text_position_selector['end']
    if ( anno_dict.hasOwnProperty(position) == false ) {
      anno_dict[position] = [];
      anno_dict[position].push( {
        "id":row['id'], "user":user, "position":position, "exact":exact,
        "text":text, "prefix":prefix } );
    }
  }

  // accumulate payloads for each position key and anchor each accumulations
  var keys = [];
  for(var k in anno_dict) keys.push(k);
  for (i=0; i<keys.length; i++) {
    key = keys[i];
    var anno_list = anno_dict[key];
    var first_anno = anno_list[0];
    var exact = first_anno['exact'];
    var prefix = first_anno['prefix'];
    var payload = ''
    for (j=0; j<anno_list.length; j++) {
      var anno = anno_list[j];
      payload += anno['user'] + '\n' + anno['text'] + '\n\n';
    }

    attach_annotation( key, exact, prefix, payload, anno );
  }
}

module.exports = get_annotations;
