kwinactivate
============

kde plasma/kwin script to cycle through windows with hotkeys

## Installation
    plasmapkg -t kwinscript -i .

## Activation

    You can enable or disable the plugin, after installation, using *System Settings*, under *Window Behaviour › KWin Scripts*.

## Usage

Use hotkeys defined at the bottom of winactivate.kwinscript to cycle through windows of the same type (Meta is usually the Windows key)

## Defined new hotkeys

Here is an example definition:
  add2windowgroup("virtual",  /virtualbox/);
  add2windowgroup("virtual",  /wine/, /.*TeamViewer.*/);
  registerBoth("Meta+V", "virtual",  "virtualbox");

This defines a new group "virtual" which matches 2 types of window:
- The ones whose classname **is** virtualbox
- The ones whose classname **is** wine *and* title **contains** TeamViewer
The hotkey Win+V is then registered for:
- cycling through matching windows if there are any
- launching program virtualbox otherwise
