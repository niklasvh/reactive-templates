function DOMSerializer() {}

function Node(nodeType) {
  this.nodeType = nodeType;
  this.childNodes = [];
}

Node.prototype.appendChild = function(node) {
  if (node.innerHTML) {
    var fakeNode = new Node(this.TEXT_NODE);
    fakeNode.textContent = node.innerHTML;
    node.innerHTML = undefined;
    this.childNodes.push(fakeNode);
  } else {
    this.childNodes.push(node);
  }
  return node;
};

Node.prototype.setAttribute = function(name, value) {
  this.attributes[name] = value;
};

Object.defineProperty(Node.prototype, "firstChild", {
  get: function() {
    return this.innerHTML ? this : false;
  }
});

function renderAttribute(attributes) {
  return function(name) {
    return name + '="' + attributes[name] + '"';
  };
}

Node.prototype.ELEMENT_NODE = 1;
Node.prototype.TEXT_NODE = 3;
Node.prototype.DOCUMENT_FRAGMENT_NODE = 11;

Node.prototype.toString = function() {
  var walk = function(nodes) {
    return nodes.map((function(node) {
      if (node.nodeType === node.TEXT_NODE) {
        return String(node.textContent);
      } else if (node.nodeType === node.ELEMENT_NODE) {
        return "<" + node.tagName + (Object.keys(node.attributes).length ? " " + Object.keys(node.attributes).map(renderAttribute(node.attributes)) : "") + ">" + String(node) + "</" + node.tagName + ">";
      } else if (node.nodeType === node.DOCUMENT_FRAGMENT_NODE) {
        return walk(node.childNodes);
      } else {
        console.log("Unknown nodeType", node.nodeType);
      }
    })).join("");
  };

  return walk(this.childNodes);
};

DOMSerializer.prototype.createTextNode = function(text) {
  var node = new Node(Node.prototype.TEXT_NODE);
  node.textContent = text;
  return node;
};

DOMSerializer.prototype.createElement = function(name) {
  var node = new Node(Node.prototype.ELEMENT_NODE);
  node.tagName = name;
  node.attributes = {};
  return node;
};

DOMSerializer.prototype.createDocumentFragment = function() {
  return new Node(Node.prototype.DOCUMENT_FRAGMENT_NODE);
};

exports.DOMSerializer = DOMSerializer;