var yaml = require("js-yaml"),
    fs = require("fs"),
    Compile = require("../src/compile.js").Compile,
    AliveTemplate = require("../src/compile.js").AliveTemplate,
    DOMSerializer = require("./DOMSerializer.js").DOMSerializer;

var testPath = "test/";
var tests = ['basic.yml', 'interpolation.yml'];

tests.forEach(function(filename) {
  exports[filename] = function(test) {
    var testData = yaml.safeLoad(fs.readFileSync(testPath + filename).toString());
    test.expect(testData.tests.length);
    testData.tests.forEach(function(testCase) {
      var compiledTemplate = new AliveTemplate(Compile(testCase.template));
      var options = {document:  new DOMSerializer()};
      test.equal(compiledTemplate.render(testCase.data || {}, options).toString(), testCase.expected, testCase.name);
    });
    test.done();
  };
});

