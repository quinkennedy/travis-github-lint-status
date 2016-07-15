var GitHubAPI = require('github');
var ESLint = require('eslint');

var report = processFiles('.');
printReport(report);
updateStatus(report);

function processFiles(glob){
  var cli = new ESLint.CLIEngine();
  var report = cli.executeOnFiles(cli.resolveFileGlobPatterns([glob]));
  return report;
}

function printReport(report){
  for (var result of report.results){
    if (result.errorCount !== 0 ||
        result.warningCount !== 0){
      console.log(result.filePath);
      for (var message of result.messages){
        var type = (message.severity == 2 ? 'error' : 'warng');
        console.log(type, 
                    'line', 
                    message.line, 
                    message.message, 
                    message.ruleId);
      }
    }
  }
}

function updateStatus(report){

  var github = new GitHubAPI();

  // authenticate with API
  github.authenticate({
    type:  'oauth',
    token: process.env.TRAVIS_GITHUB_LINT_STATUS_TOKEN
  });

  // get travis environment variables
  var travisSlug = process.env.TRAVIS_REPO_SLUG;
  var travisJob = process.env.TRAVIS_JOB_ID; 
  var travisEvent = process.env.TRAVIS_EVENT_TYPE;
  var sha = process.env.TRAVIS_COMMIT;

  // parse "slug" into name/repo segments for github module
  var parsedSlug = travisSlug.split('/');
  var user = parsedSlug[0];
  var repo = parsedSlug[1];

  // create other parameters for github module
  var target_url = 'https://travis-ci.org/'+travisSlug+'/jobs/'+travisJob;
  var state = (report.errorCount === 0 ? 'success' : 'failure');
  var description = 'errors: ' + report.errorCount + 
                    ', warnings: ' + report.warningCount;
  var context = 'ci/lint/'+travisEvent;

  console.log('using target_url', target_url);

  var details = {
    user,
    repo,
    sha,
    state,
    target_url,
    description,
    context
  };

  console.log(details);

  // make API call
  github.repos.createStatus(details);
}

