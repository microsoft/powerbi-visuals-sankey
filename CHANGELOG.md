## 3.5.0.0

### New features
* Added conditional formatting to link color options
* Added matchNodeColor setting to links
* Added border color for links

## 3.4.6.0

### New features
* Used automatic sorting of links by default
* Adjusted vertical positions of nodes in the same column

### Development
* Keep columnIndex in persist properties along with positions

## 3.4.5.0

### New features
* Added a reset button that returns nodes to their original positions
* Added a toggle that enables automatic sorting of links

### Other
* Used levelValues instead of deprecated values

## 3.4.4.0

### New features
* Nodes and links data labels have extended font formatting settings
* Visual supports report page tooltips

### Development
* Migrated to the new eslint version
* Updated workflow files

### Other
* Used join d3 pattern istead enter-append-exit
* API 5.11.0
* Packages update

## 3.4.3.0
* Fix weight with zero values

## 3.4.2.0
* Fix context menu for links and nodes

## 3.4.1.0
* Fix npm vulnerabilities

## 3.4.0.0
* Change forward cycles links processing

## 3.3.1.0
* Localization update

## 3.3.0.0
* Use selection manager instead of interactivity utils
* Change links style

## 3.2.2.0
* Add weight option on the formatting pane
* Add input/output tooltip values for node
* Fix styles for keyboard navigation
* Change backward links positions
* Update outdated packages

## 3.2.1.0
* Fix a bug with selection cycle nodes
* Change the way the cycle links are processed
* Update outdated packages

## 3.2.0.0
* Add keyboard support

## 3.1.3.0
* Fix a bug with displaying japanese characters in link labels
* Update outdated packages

## 3.1.2
* Add typescript to dependencies

## 3.1.1
* Update outdated packages

## 3.1.0
* Migration to Formatting model

## 3.0.8
* powerbi-visuals-tools packages updated

## 3.0.7
* Testutils version updated to 3.2.0
* lockFileVersion is updated to version 3
* node version updated to 18 in build.yml config

## 3.0.6
* Area of visibility bug fixed in dragged and draggend functions

## 3.0.5
* Link tooltip display format issue fixed
* Node tooltip output weight calculation fixed
* Dependencies updated

## 3.0.1
* Context menu fix
* Selection fix

## 2.1.0
* Updated APIs
* Sorting added

## 2.0.2
* Fix Sankey diagram colors

## 2.0.1
* Fix selection issue

## 2.0.0
* The visual converted to use the new tools 3.0

## 1.10.0
* High contrast mode
* API 1.13.0

## 1.9.0

* Added localization for all supported languages

## 1.8.0

* Added Power BI bookmarks support

## 1.7.1

* Fix drawing backward links on difficult graph (with many backward links)

## 1.7.0

* Options to configure to display cycles
* Display cycles on graph as backward links

## 1.6.1

* Links properties were disappeared - fixed

## 1.6.0

* New option: provide min optimal height of node

## 1.5.2

* Drag&drop crashes browser - fix

## 1.5.1

* Fix error when the visual doesn't display chart without values dataset

## 1.5.0

* Added 'Display unit' property to configure value formatting for data labels

## 1.4.2

* Fix lines scaling issue when visual size is small

## 1.4.1

* Fix restoring settings when data set was filtered
* Fix links labels for graph with cycles
* Fix saving settings for graph with cycles

## 1.4.0

* Feature to move nodes to any place in the viewport

## 1.3.1

* Fix applying settings of link labels

## 1.3.0

* Add link data labels displaying

## 1.2.7

* Fix scale settings text.
* Fix displaying the visual with numeric at Source and Destination fields
* Downgrade API version to 1.6.0

## 1.2.5

* Fix selection issue for cloned nodes in dataset with cycles
* Add new property to configure scale behavior for links

## 1.2.4

* Displaying links with negative value issue

## 1.2.3

* Fix node selection issue

## 1.2.2

* Localization support was added
* Issue with displaying weight value from 0 to 1 was fixed

## 1.2.0

* Version has been increased for Office Store publication

## 1.0.1

* Improve nodes and links sizes scaling when data values of weight differ significantly.
* Display self-connected nodes correctly.
* Option for force display all data labels
* Fixed issue when some links doesn't show if height of SVG path is less than 1
* Displaying nodes and links when graph has cycles
