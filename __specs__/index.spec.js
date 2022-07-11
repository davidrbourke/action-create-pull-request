const github = require('@actions/github');
const coreMock = require('@actions/core');
const createPullRequestAction = require('../index');

jest.mock('@actions/core');

describe('create-pull-request', () => {

  beforeEach(() => {
    process.env.GITHUB_REPOSITORY = 'a/b';
  })

  it('queries for expected inputs', () => {
    // Arrange
    const mockedGetInput = coreMock.getInput.mockReturnValue('test');

    // Act
    createPullRequestAction();

    // Assert
    expect(mockedGetInput.mock.calls[0]).toEqual(["source_branch", {"required": true}]);
    expect(mockedGetInput.mock.calls[1]).toEqual(["target_branch", {"required": true }]);
    expect(mockedGetInput.mock.calls[2]).toEqual(["github_token", {"required": true }]);
    expect(mockedGetInput.mock.calls[3]).toEqual(["label"]);
    expect(mockedGetInput.mock.calls[4]).toEqual(["reviewers"]);
  });

  it('attemps to create a pull request when there are file differences', async () => {
    // Arrange
    github.getOctokit = jest.fn().mockReturnValue({
      rest: {
        issues: { getLabel: jest.fn() },
        repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
        pulls: { create: jest.fn().mockResolvedValue({data: {}})
        }
      }
    });
    const octokit = github.getOctokit('token');
    
    // Act
    await createPullRequestAction();

    // Assert
    expect(octokit.rest.repos.compareCommitsWithBasehead).toHaveBeenCalledTimes(1);
    expect(octokit.rest.pulls.create).toHaveBeenCalledTimes(1);
  });

  it('does not attempt create a pull request when there are no file differences', async () => {
    // Arrange
    github.getOctokit = jest.fn().mockReturnValue({
      rest: { issues: {  getLabel: jest.fn() },
        repos: {  compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: []}})},
        pulls: { create: jest.fn().mockResolvedValue({data: {}})
        }
      }
    });
    const octokit = github.getOctokit('token');
    
    // Act
    await createPullRequestAction();

    // Assert
    expect(octokit.rest.repos.compareCommitsWithBasehead).toHaveBeenCalledTimes(1);
    expect(octokit.rest.pulls.create).toHaveBeenCalledTimes(0);
  });


  it ('assigns a new label to a pull request', async () => {
    // Arrange
    coreMock.getInput.mockReturnValue('automerge-label');

    github.getOctokit = jest.fn().mockReturnValue({
      rest: {
        issues: { 
          getLabel: jest.fn().mockRejectedValue({message: 'NotFound'}),
          createLabel: jest.fn().mockResolvedValue({data: {}}),
          addLabels: jest.fn().mockResolvedValue({data: {}}),
        },
        repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
        pulls: { create: jest.fn().mockResolvedValue({data: { number: 1000}})
        }
      }
    });
    const octokit = github.getOctokit('token');
    
    // Act
    await createPullRequestAction();

    // Assert
    expect(octokit.rest.issues.getLabel).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.getLabel).toHaveBeenCalledWith({"name": "automerge-label", "owner": "a", "repo": "b"});
    expect(octokit.rest.issues.createLabel).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.createLabel).toHaveBeenCalledWith({
      "color": "27ff28",
      "description": "Pull requests marked with this label will be automatically merged on approval",
      "name": "automerge-label",
      "owner": "a",
      "repo": "b",
    });
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      "issue_number": 1000,
      "labels": ["automerge-label"],
        "owner": "a",
        "repo": "b",
    });
  });

  it ('assigns an existing label to a pull request', async () => {
    // Arrange
    coreMock.getInput.mockReturnValue('automerge-label');

    github.getOctokit = jest.fn().mockReturnValue({
      rest: {
        issues: { 
          getLabel: jest.fn().mockResolvedValue({data: {}}),
          createLabel: jest.fn().mockResolvedValue({data: {}}),
          addLabels: jest.fn().mockResolvedValue({data: {}}),
        },
        repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
        pulls: { create: jest.fn().mockResolvedValue({data: { number: 1000}})
        }
      }
    });
    const octokit = github.getOctokit('token');
    
    // Act
    await createPullRequestAction();

    // Assert
    expect(octokit.rest.issues.getLabel).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.getLabel).toHaveBeenCalledWith({"name": "automerge-label", "owner": "a", "repo": "b"});
    expect(octokit.rest.issues.createLabel).toHaveBeenCalledTimes(0);
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledTimes(1);
    expect(octokit.rest.issues.addLabels).toHaveBeenCalledWith({
      "issue_number": 1000,
      "labels": ["automerge-label"],
        "owner": "a",
        "repo": "b",
    });
  });

  it ('does not add a label where none is provided', async () => {
      // Arrange
      coreMock.getInput.mockReturnValue(undefined);
  
      github.getOctokit = jest.fn().mockReturnValue({
        rest: {
          issues: { 
            getLabel: jest.fn().mockResolvedValue({data: {}}),
            createLabel: jest.fn().mockResolvedValue({data: {}}),
            addLabels: jest.fn().mockResolvedValue({data: {}}),
          },
          repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
          pulls: { create: jest.fn().mockResolvedValue({data: { number: 1000}})
          }
        }
      });
      const octokit = github.getOctokit('token');
      
      // Act
      await createPullRequestAction();
  
      // Assert - no labels are created
      expect(octokit.rest.issues.getLabel).toHaveBeenCalledTimes(0);
      expect(octokit.rest.issues.createLabel).toHaveBeenCalledTimes(0);
      expect(octokit.rest.issues.addLabels).toHaveBeenCalledTimes(0);
      // Assert - a pull request is still created
      expect(octokit.rest.pulls.create).toHaveBeenCalledTimes(1);
    });


    it('adds github reviewers when they are provided', async () => {
      // Arrange
      coreMock.getInput = (field) => field === 'reviewers' ? 'user1,user2' : undefined;
  
      github.getOctokit = jest.fn().mockReturnValue({
        rest: {
          issues: { getLabel: jest.fn().mockResolvedValue({data: {}}) },
          repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
          pulls: { 
            create: jest.fn().mockResolvedValue({data: { number: 1000}}),
            requestReviewers: jest.fn().mockResolvedValue({data: {}})
          }
        }
      });
      const octokit = github.getOctokit('token');
      
      // Act
      await createPullRequestAction();
  
      // Assert
      expect(octokit.rest.pulls.create).toHaveBeenCalledTimes(1);
      expect(octokit.rest.pulls.requestReviewers).toHaveBeenCalledTimes(1);
      expect(octokit.rest.pulls.requestReviewers).toHaveBeenCalledWith({"owner": "a", "pull_number": 1000, "repo": "b", "reviewers": ["user1", "user2"]});
    });

    it('does not add reviewers when none are provided', async () => {
      // Arrange
      coreMock.getInput = () => undefined
  
      github.getOctokit = jest.fn().mockReturnValue({
        rest: {
          issues: { getLabel: jest.fn().mockResolvedValue({data: {}}) },
          repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
          pulls: { 
            create: jest.fn().mockResolvedValue({data: { number: 1000}}),
            requestReviewers: jest.fn().mockResolvedValue({data: {}})
          }
        }
      });
      const octokit = github.getOctokit('token');
      
      // Act
      await createPullRequestAction();
  
      // Assert
      expect(octokit.rest.pulls.create).toHaveBeenCalledTimes(1);
      expect(octokit.rest.pulls.requestReviewers).toHaveBeenCalledTimes(0);
    });

    it('sets output properties', async () => {
      // Arrange
      coreMock.setOutput = jest.fn();
  
      github.getOctokit = jest.fn().mockReturnValue({
        rest: {
          issues: { getLabel: jest.fn().mockResolvedValue({data: {}}) },
          repos: { compareCommitsWithBasehead: jest.fn().mockResolvedValue({data: { files: ['']}})},
          pulls: { 
            create: jest.fn().mockResolvedValue({data: { number: 1000, html_url: "https://github...", title: "New PR Created"}}),
          }
        }
      });
      
      // Act
      await createPullRequestAction();
  
      // Assert
      expect(coreMock.setOutput.mock.calls[0]).toEqual(["url", "https://github..."]);
      expect(coreMock.setOutput.mock.calls[1]).toEqual(["title", "New PR Created"]);
    });

    it('logs an error if the action fails', async () => {
      // Arrange
      coreMock.setFailed = jest.fn();
      github.getOctokit = jest.fn().mockReturnValue({
        rest: {
          repos: {
            compareCommitsWithBasehead: jest.fn().mockRejectedValue({message: "Errored"})
          },
        }
      });
  
      // Act
      await createPullRequestAction();
  
      // Assert
      expect(coreMock.setFailed).toHaveBeenCalledTimes(1);
      expect(coreMock.setFailed).toHaveBeenCalledWith("Errored");
    });
});
