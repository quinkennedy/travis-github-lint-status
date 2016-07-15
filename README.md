This is a GitHub integration powered by Travis-CI

# Why
I wanted to separate Linter results from Test results. 
I don't believe that continuous integration should fail because 
of simple linting errors. 
This module is meant to post Linter results as a separate Status 
line on a GitHub commit or Pull Request.

# Setup
First you will need to create a [Personal Access Token][0] with 
the *repo:status* permission. 
Add your generated token to your repository's Environment Varibles 
in Travis-CI as `TRAVIS-GITHUB-LINT-STATUS-TOKEN`. 
You can access the Environment Variables in Travis-CI by going 
to your repository's Settings page on the Travis-CI website.

Next you will need to load this module during your Travis-CI execution. 
In your _install_ section add `npm install travis-github-lint-status`. 
If you don't have an _install_ section, you will need to add one 
(example in YAML):
```
install:
  - npm install;
    npm install travis-github-lint-status;
```

Then the actual call in the _script_ section 
(again in YAML, replace `npm run coverage` with whatever your 
standard CI run script is):
```
script:
  - npm run coverage;
    ./node_modules/travis-github-lint-status/src/index.js
```


[0]: https://github.com/settings/tokens
