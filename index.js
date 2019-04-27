var xml = require('xml-js')
var assert = require('nanoassert')
var parseAuthor = require('parse-author')

function getNodeByName(name, elements) {
  for (element of elements) {
    if(element.name === name) {
      return element;
    }
  }
}

function errorAndExit(errMsg) {
  console.error(errMsg);
  process.exit(-1);
}

function upsertTextNode(parent, name, text) {
  node = getNodeByName(name, parent.elements);
  if (!node) {
    parent.elements.push({
      type: 'element',
      name: name,
      elements: [{type: 'text', text: text}]
    })
    return;
  }
  for (el of node.elements) {
    if (el.type === 'text') {
      el.text = text;
    }
  }
}

module.exports = function (jsonObj, xmlStr, mode) {
  assert(jsonObj != null)
  assert(typeof xmlStr === 'string')

  var xmlDoc = new xml.xml2js(xmlStr)

  switch (mode) {
    case 'plugin':
      plugin = getNodeByName('plugin', xmlDoc.elements);
      plugin.attributes.version = jsonObj.version || errorAndExit('No version found in package.json');
      plugin.attributes.id = jsonObj.name || errorAndExit('No package name found in package.json');
      name = getNodeByName('name', plugin.elements)
      name.elements[0].text = jsonObj.name;
      if (jsonObj.description) {
        upsertTextNode(plugin, 'description', jsonObj.description);
      }
      if (jsonObj.license) {
        upsertTextNode(plugin, 'license', jsonObj.license);
      }
      if (Array.isArray(jsonObj.keywords)) {
        upsertTextNode(plugin, 'keywords', jsonObj.keywords.join());
      }
      if (jsonObj.repository) {
        if (typeof jsonObj.repository === 'string') {
          upsertTextNode(plugin, 'repo', jsonObj.repository);
        } else if (jsonObj.repository.url) {
          upsertTextNode(plugin, 'repo', jsonObj.repository.url);
        }
      }
      if (jsonObj.bugs) {
        if (jsonObj.bugs.url) {
          upsertTextNode(plugin, 'issue', jsonObj.bugs.url);
        }
      }
      break;
    case 'config':
      widget = getNodeByName('widget', xmlDoc.elements);
      widget.attributes.version = jsonObj.version || errorAndExit('No version found in package.json');

      // displayName is a cordova convention
      if (jsonObj.displayName) {
        upsertTextNode(widget, 'name', jsonObj.displayName);
      }
      if (jsonObj.description) {
        upsertTextNode(widget, 'description', jsonObj.description);
      }
      break;
    default:
      break;
  }

  stringXml = xml.js2xml(xmlDoc, {spaces: 4, indentCdata: true});
  return stringXml;
}
