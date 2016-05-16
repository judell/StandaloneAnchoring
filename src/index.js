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
  var url = 'https://hypothes.is/api/search?limit=200&uri=' + uri + '&user=' + user;

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

function get_range(anno) {
   var selectors = anno.target[0].selector;
   for (i=0; i<selectors.length; i++) {
	   var selector = selectors[i];
	   if (selector.hasOwnProperty('start')) {
		   return Math.abs(selector.start - selector.end);
	   }
   }
   return 0;
}

function compare(a,b) {
  range_a = get_range(a);
  range_b = get_range(b);
  if (range_a > range_b)
    return -1;
  else if (range_a < range_b)
    return 1;
  else 
    return 0;
}

function attach_annotations(data) {
  var rows = data['rows'];
  rows.sort(compare);

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
    try { attach_annotation( '', exact, prefix, payload, anno );}
    catch (e) {	console.log('attach_annotation: ' + anno.id + ': ' + e.message); }
    }

}

module.exports = get_annotations;
