function attach_annotation(exact, prefix, payload, data) {
  var wrap = require('wrap-range-text');
  var TextQuoteAnchor = require ('dom-anchor-text-quote');

  var range = TextQuoteAnchor.toRange(document.body, {"exact":exact,"prefix":prefix});

  var highlight = document.createElement('mark');
  highlight.id = 'hypothesis-' + data.id;
  highlight.setAttribute('data-hypothesis', JSON.stringify(data));
  highlight.title = payload;
  highlight.className = 'hypothesis_annotation';

  wrap(highlight, range);
}

function get_annotations(uri, user, offset, rows) {
    var query = 'https://hypothes.is/api/search?offset=' + offset + '&limit=200&uri=' + uri + '&user=' + user;	
    var xhr = new XMLHttpRequest();
    xhr.addEventListener("load", function() {
      var data = JSON.parse(xhr.responseText);
      rows = rows.concat(data.rows);
      if  ( data.rows.length != 0 ) {
		 console.log('offset: ' + offset);
         get_annotations(uri, user, offset+200, rows);
      }
      else {
        attach_annotations(rows);
		var event = new Event('AnnotationsLoaded');
		document.body.dispatchEvent(event);
      }
    });
	xhr.open("GET", query);
	xhr.send();
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
  if (selectors) {
  for (i=0; i<selectors.length; i++) {
    var selector = selectors[i];
    if (selector.hasOwnProperty('start')) {
      return Math.abs(selector.start - selector.end);
      }
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

function attach_annotations(rows) {
  rows.sort(compare);

  var anno_dict = {};

  for ( var i=0; i < rows.length; i++ ) {
    var row = rows[i];
    if ( row.hasOwnProperty('references') ) // skip replies
      continue;
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
    try { attach_annotation(exact, prefix, payload, anno );}
    catch (e) {	console.log('attach_annotation: ' + anno.id + ': ' + e.message); }
    }

}

module.exports = get_annotations;
