var GitHubAPI = require('github');
var ESLint = require('eslint');
var Colors = require('colors/safe');

var report = processFiles('.');
printReport(report);
updateStatus(report);

function processFiles(glob){
  var cli = new ESLint.CLIEngine();
  var report = cli.executeOnFiles(cli.resolveFileGlobPatterns([glob]));
  return report;
}

function printReport(report){

  console.log(Colors.bold('-- begin ESLint report --\n'));

  // for each file that has problems, write out all the problems
  //   the color/format takes cues from 
  //   the regular command-line eslint output
  for (var result of report.results){

    if (result.errorCount !== 0 ||
        result.warningCount !== 0){

      console.log(Colors.underline(result.filePath));

      for (var message of result.messages){
        var type, typeColor;

        if (message.severity === 2){
          // pad 'error' string to match 'warning' string length
          type = 'error  ';
          typeColor = Colors.red;
        } else {
          type = 'warning';
          typeColor = Colors.yellow;
        }

        console.log('  ',
                    typeColor(type),
                    Colors.gray(message.line),
                    message.message,
                    Colors.gray(message.ruleId));
      }

      // extra line at the end to provide visual separation between files
      console.log();
    }
  }

  // general report at the end
  if (report.errorCount !== 0){
    console.log(Colors.red.bold('%d problems (%d errors, %d warnings)'),
                report.errorCount + report.warningCount,
                report.errorCount,
                report.warningCount);
  } else if (report.warningCount !== 0){
    console.log(Colors.yellow.bold('%d warnings'),
                report.warningCount);
  } else {
    console.log(Colors.green.bold('no lint issues!'));
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

  var details = {
    user,
    repo,
    sha,
    state,
    target_url,
    description,
    context
  };

  // make API call
  github.repos.createStatus(details);
}

