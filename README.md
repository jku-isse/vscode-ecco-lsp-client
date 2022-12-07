
# ECCO Language Server Client end-user documentation
## Introduction
### Purpose
This Visual Studio Code plug-in provides support for ECCO Language Server Protocol implementation. The plug-in enables end-user to perform essential ECCO
workflows from within the editor without the need to open ECCO GUI. Plug-in is tightly integrated with specific ECCO Language Server implementation to provide
functionality that is outside of the original Language Server Protocol scope.

### Dependencies
Plug-in targets recent versions of Visual Studio Code (tested with 1.73.0). ECCO system is bundled within the plug-in itself, therefore there is no requirement
for having ECCO installed in the system (however, be aware that plug-in always uses bundled ECCO, and there is a potential for incompatibilities between
system ECCO and bundled ECCO versions if both are used to access a repository). The plug-in requires JVM to be installed and available in `PATH` environment variable
(tested with OpenJDK 19).

### Limitations and other considerations
At the moment, ECCO adapters available in the plug-in are statically defined at compile time and cannot be changed or overriden without repackaging of the plugin. It shall be also noted that plug-in behaviour
on specific files largely depends on respective ECCO adapter behaviour, therefore specific adapter issues
can manifest themselves through the plug-in. 

Interaction with other plug-ins implementing language-specific LSP
clients had not been thoroughly tested at the moment, therefore conflicts
might arise.

## User Interface description
### Activation
The plug-in is activated whenever `.ecco/id` file is detected in a workspace folder. Plug-in supports
multi-folder workspace configurations, with requirement that all folders of the workspace are local directories.
Activation is automatic once the plug-in is installed and relevant folder
is added to the workspace. Please note that plug-in activation might
take some time; issuing ECCO commands before the activation had finished
will lead to UI errors (track ECCO-specific UI elements described in
`UI elements` section below to see whether activation had finished).

### UI elements
Plug-in both re-uses relevant standard Visual Studio Code capabilities and introduces ECCO-specific
UI elements. 
#### Built-in VSCode capabilities
Following built-in VSCode UI elements are used to represent ECCO information:
* `Outline` view of VSCode displays ECCO features present in currently
  opened document. Clicking on the feature in `Outline` will cause the
  editor cursor to jump to the first occurence of the feature.
* Hovering over a fragment of source code in the editor will display a
  tool-tip containing ECCO configuration of an association that contains
  hovered fragment.
* Double-click on a document fragment will highlight other fragments
  that belong to the same ECCO association in the document.
* ECCO associations are rendered in the editor via color palette
  elements (colourful rectangles). Depending on specific ECCO adapter
  type, these elements might get rendered either on the left side of
  the document (when the adapter is not able to provide more specific
  locations), or more precisely located in document text. The latter
  behaviour, however, can interfere with normal user editing workflow,
  so it can be disabled with plug-in configuration setting (see
  `Configuration` section below). In that case, color palette elements
  will be rendered on the left side of the document regardless of ECCO
  adapter capabilities.
  
  If no information regarding associations is available for for a fragment,
  respective color palette elements are not rendered as well. Element colors
  are computed based on association with no checks for collisions (as
  they are quite unlikely).

#### ECCO-specific UI elements
As default VSCode LSP capabilities do not provide enough flexibility
to support ECCO workflows, following special UI elements are also supported:
* ECCO Repository overview page that is available via `ECCO` button
  in the status bar (normally located at the bottom of the window). Overview
  page contains plain-text information about ECCO repository state
  (base directory, current configuration, commits and known features).
  If multiple ECCO repositories are present in the workspace, repository
  selection dialog will be displayed prior to rendering the page.
  Page is not interactive and does not track changes in the repository
  after it was rendered.
* ECCO Association page, displaying ECCO associations of document fragments
  via changing fragment background color. Highlighted document is rendered
  in a separate tab on the right side of window. Association conditions that
  correspond to highlighting colors are listed in a table at the end of
  rendered document. This view is a counterpart for ECCO association
  elements described in `Built-in VSCode capabilities`, following the same
  colouring scheme, however, having slightly different purpose. Separate
  association page remains static after it was rendered, and it's general
  goal is providing more detailed view of document state at some point
  for deeper inspection. Association elements in the editor are dynamic --
  responsive to edits but their positions might be calculated with less
  precision.

  Association page can be rendered for active editor via
  `Render ECCO document associations` command in VSCode command palette
  (in default configuration can be opened via `Ctrl+Shift+P`). Make sure
  that the editor is active (has focus) prior to rendering the page.
* ECCO Feature page, displaying document fragments that contain specified
  features. The page is very similar to previously described association
  page, however it enables user to specify exact set of features to render.
  The page then highlights document fragments based on subset of selected
  features that appear in a fragment. Feature correspondce to colors is
  contained in a table at the bottom of the page. Similarly to association
  page, feature page is not interactive after it has been rendered.

  Feature page can be rendered for active editor via
  `Render ECCO document features` command in VSCode command palette.
  Make sure that the editor is active (has focus) prior to rendering
  the page.
* ECCO Checkout is a command to perform specific ECCO configuration in
  the repository. The command is destructive -- it requires user to manually
  remove all current state of repository (anything besides `.ecco`
  directory) prior to executing checkout. After the checkout was requested,
  user is prompted with desired checkout configuration -- comma-sepeated
  list of ECCO feature revisions (the same format as in ECCO `.config`
  file). Closing the prompt (by pressing `Esc`) will abort checkout. Once
  the configuration is provided, checkout operation starts. A pop-up
  indicating checkout activity will appear in the right bottom corner.
  User shall not perform any actions while checkout is on-going, as it
  might interfere with ECCO checkout process. Once it's finished (or
  failed), another pop-up notification will appear.

  Command can be activated via `ECCO Checkout` command in VSCode command
  palette. If multiple ECCO repositories are present in the workspace,
  it'll prompt user to select repository to perform checkout on.
* ECCO Commit is a command to commit current repository state into ECCO.
  The command will prompt user with commit message and ECCO configuration
  string (if empty configuration is provided, data from `.config` file
  will be used). Both prompts can be aborted by pressing `Esc`. Once
  commit message and configuration are provided, commit operation starts.
  A pop-up indicating commit activity will appear in the right bottom
  corner. User shall not perform any actions while commit is on-going,
  as it might interfere with ECCO commit process. Once it's finished (or
  failed), the window will be reloaded.

  Command can be activated via `ECCO Commit` command in VSCode command
  palette. If multiple ECCO repositories are present in the workspace,
  it'll prompt user to select repository to perform commit on.

#### Configuration
Configuration is performed via standard VSCode workspace configuration
mechanism. At the moment, the plug-in supports a single configuration
option:
* `ecco.ignoreColumnsForColoring` -- boolean flag specifying whether
  built-in association coloring elements shall ignore specific locations
  provided by ECCO adapters and get rendered on the left side of the
  document instead.

#### Localization
At the moment, plug-in does not support localizations. All UI messages
are provided in English.

## Author
Visual Studio Code extension and Language Server Protocol support
for ECCO were implemented by Jevgenijs Protopopovs as part of
software engineering project at JKU Linz.

Relevant links:
* [Visual Studio Code plug-in](https://github.com/protopopov1122/vscode-ecco-lsp-client)
* [Fork of ECCO repository containing LSP implementation](https://github.com/protopopov1122/ecco)
* [Upstream ECCO repository](https://github.com/llinsbauer/ecco)