#!/usr/bin/env node

// used for interfacing with the GitHub API
var GitHubAPI = require('github');
// the actual Linter
var ESLint = require('eslint');
// used for colorizing the console output to increase readability
var Colors = require('colors/safe');

// print out Travis vars for debugging
printTravisVars();
// run ESLint on all project files
var report = processFiles('.');
// print the results to the console
printReport(report);
// notify GitHub of the status
updateStatus(report);

/**
 *  runs ESLint on all the project files
 *  @param {string} glob the pattern to use for file discovery
 *  @returns {object} ESLint report
 */
function processFiles(glob){
  var cli = new ESLint.CLIEngine();
  var report = cli.executeOnFiles(cli.resolveFileGlobPatterns([glob]));
  return report;
}

/**
 *  Print the ESLint report to the console
 *  @param {object} report The ESLint report to print
 */
function printReport(report){

  console.log(Colors.bold('-- begin ESLint report --\n'));

  // for each file that has problems, write out all the problems
  //   the color/format takes cues from 
  //   the regular command-line eslint output
  for (var result of report.results){

    if (result.errorCount !== 0 ||
        result.warningCount !== 0){

      printFileResult(result);

    }
  }

  printReportFooter(report);
}

/**
 * Prints the results of the specific file
 * @param {object} result The ESLint results for a single file
 */
function printFileResult(result){

  console.log(Colors.underline(result.filePath));

  if (result.messages.length === 0){
    console.log('no issues');

  } else {
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
  }

  // extra line at the end to provide visual separation between files
  console.log();
}

/**
 * Prints the ESLint footer
 * @param {object} report The ESLint report to print a footer for
 */
function printReportFooter(report){

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

/**
 * Updates the GitHub Status of the processed commit. This method relies on
 *   a lot of Travis-CI and custom environment variables.
 * @param {object} report The ESLint report
 */
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
  var type = (travisEvent === 'pull_request' ? 'pr' : travisEvent);
  var context = 'ci/lint/'+type;

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

/**
 * Utility method for logging Travis-CI environment variables. 
 *   Mostly for debugging
 */
function printTravisVars(){
  var travisVars = [
    'TRAVIS_BRANCH', 
    'TRAVIS_BUILD_DIR', 
    'TRAVIS_BUILD_ID', 
    'TRAVIS_BUILD_NUMBER',
    'TRAVIS_COMMIT',
    'TRAVIS_COMMIT_RANGE',
    'TRAVIS_EVENT_TYPE',
    'TRAVIS_JOB_ID',
    'TRAVIS_JOB_NUMBER',
    'TRAVIS_OS_NAME',
    'TRAVIS_PULL_REQUEST',
    'TRAVIS_REPO_SLUG',
    'TRAVIS_TEST_RESULT',
    'TRAVIS_TAG'
  ];
  var travisVals = {};
  for (var travisVar of travisVars){
    travisVals[travisVar] = process.env[travisVar];
  }
  console.log(travisVals);
}

