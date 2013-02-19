// qdbus org.kde.plasma-desktop /MainApplication showInteractiveKWinConsole
// plasmapkg -t kwinscript -l
// ls ~/.kde/share/apps/kwin/scripts
// http://techbase.kde.org/Development/Tutorials/KWin/Scripting 
// http://techbase.kde.org/Development/Tutorials/KWin/Scripting/API_4.9
// http://techbase.kde.org/KDE_System_Administration/PlasmaDesktopScripting#Locating_Applications_and_Paths
// http://quickgit.kde.org/?p=kdeexamples.git&a=blob&f=plasma%2Fjavascript%2Fgeneric%2FfileOperations%2Fcontents%2Fcode%2Fmain.js
// http://quickgit.kde.org/?p=kdeexamples.git&a=blob&f=plasma%2Fjavascript%2Fgeneric%2FfileOperations%2Fmetadata.desktop
// http://kde-look.org/index.php?xcontentmode=91

var windowGroups = new Object();

function WindowType(classname, title) {
  this.classname = classname;
  this.title = title;
}


WindowType.prototype["match"]  = function(client) {
  print("==> testing "+this.title+" === "+client.caption
  + " "+(this.title == null || this.title.test(client.caption))
  + " and "+this.classname+" === "+client.resourceClass.toString()
  + " "+(this.classname == null || this.classname.test(client.resourceClass.toString())));
  return ((this.title == null || this.title.test(client.caption)) &&
    (this.classname == null || this.classname.test(client.resourceClass.toString())));
}

function WindowGroup() { }

WindowGroup.prototype = new Array();

WindowGroup.prototype["matchAny"] = function(client) {
  for (var i = 0, l=this.length; i < l; ++i) {
    var windowtype=this[i];
    if (windowtype.match(client)) {
//      print("Success!! "+client.caption);
      return true;
    }
  }
  return false;
}

function add2windowgroup(group, classname) {
  add2windowgroup(group, classname, null);
}
function add2windowgroup(group, classname, title) {
  if (windowGroups[group] == undefined) {
    windowGroups[group] = new WindowGroup();
  }
  windowGroups[group].push( new WindowType(classname, title) );
}

var knownGroups="";
for (kGroup in windowGroups) { knownGroups += kGroup; }
print(knownGroups);
print(workspace.workspaceWidth);
print(workspace.activeClient);

var search = false;

/** Returns whether given client matched. */
function kwinactivateclient(client,targetGroupName) {
    var success=false;
    if (client == workspace.activeClient) {
      search = !search;
    } else if (search) {
     // print(Object.getOwnPropertyNames(this.classname));
      group = windowGroups[targetGroupName];
      if (group === undefined) {
	var knownGroups="";
	for (kGroup in windowGroups) { knownGroups += kGroup; }
	print("Unknow window group name: "+targetGroupName)
	print("Register it with add2windowgroup or try with these known groups: "+knownGroups);
      } else {
	if (group.matchAny(client)) {
	  print("Success!! "+client.caption);
	  workspace.activeClient = client;
	  search = false; //do nothing for remaining windows.
	  success = true; //found
	} else {
	  print(client.caption+" does not match");
	}
      }
    }
    return success;
}

function kwinactivate(targetGroupName) {
  search = false;
  var found = false;
  var cL = workspace.clientList();
  //call twice to make sure we get through thw whole window list while "search" is true
  cL.concat(cL).forEach(function(client) {
    if (!found) { found = kwinactivateclient(client,targetGroupName); }
  });
  return found;
}

function launch(launcher) {
  print ("Launching "+launcher);
  //qdbus org.kde.klauncher /KLauncher org.kde.KLauncher.start_service_by_desktop_name kate "" "" "" true
  //qdbus org.kde.klauncher /KLauncher org.kde.KLauncher.exec_blind kate -u
  //qdbus [servicename]     [path]     [interface].[method]                     [args]
  //callDBus(QString service, QString path, QString interface, QString method, QVariant arg..., QScriptValue callback = QScriptValue())

  //works: callDBus("org.kde.kwin", "/KWin", "org.kde.KWin", "setCurrentDesktop", 2);
  //qdbus org.kde.kwin /KWin org.kde.KWin.currentDesktop
  callDBus("org.kde.kwin", "/KWin", "org.kde.KWin", "currentDesktop", function (desktop) {
    print("Current Desktop through D-Bus: ", desktop);
  });
  callDBus("org.kde.krunner","/App","org.kde.krunner.App","query",launcher);
  
  //qdbus org.kde.klauncher /KLauncher org.kde.KLauncher.start_service_by_desktop_path /usr/share/applications/chromium-browser.desktop "http://google.fr" "" "" true
  callDBus("org.kde.klauncher","/KLauncher","org.kde.klauncher","start_service_by_desktop_path","/usr/share/applications/chromium-browser.desktop", "http://google.fr", "", "", "true", function() {
    print("===> success");
  });

  //qdbus org.kde.klauncher /KLauncher org.kde.KLauncher.exec_blind kshell4 konsole
  var arglist = new Array(launcher);
  print("callDBus(\"org.kde.klauncher\", \"/KLauncher\", \"org.kde.KLauncher\", \"exec_blind\", \"kshell4\", "+launcher+");");
  callDBus("org.kde.klauncher", "/KLauncher", "org.kde.KLauncher","exec_blind", "kshell4", arglist, function() {
    print("=======> "+launcher+" launched successfully !");
  });
}

function register(shortcut, targetGroupName) {
  register(shortcut, targetGroupName, null);
}

function register(shortcut, targetGroupName, launcher) {
  registerShortcut("Activate next "+targetGroupName+" window", "", shortcut, function() {
    if (!kwinactivate(targetGroupName) && launcher!=null) {
      launch(launcher);
    }
  });
}

/** launcher = null for no value ; classname|title=null for "everything" */
function registerBoth(shortcut, targetGroupName, launcher) {
  register(shortcut, targetGroupName, launcher);
  if (launcher != undefined) {
    registerShortcut("Launch "+(launcher===undefined?title:classname), "", "Shift"+shortcut, function() {
      launch(launcher);
    });
  }
}

function registerBoth(shortcut, targetGroupName) {
  group = windowGroups[targetGroupName];
  launcher = undefined;
  if (group != undefined && group[0] != undefined && group[0].classname != null) {
    register(shortcut, targetGroupName, group[0].classname.source);
  }
}

function tagClient(client) {
//  for (...) { TODO
//    if (...) {
      shortcut = "Meta...";
      client.caption += " {"+shortcut+"}";
//    }
//  }
}

workspace.clientAdded.connect(function(client) {
  print(client.windowId+" "+client.caption);
  //TODO change client's caption to indicate the shortcut that can be used to access it
  //something like for (group in windowGroups) if (group.matchAny(client) ...)
  // this requires getting rid of the global "search" variable
});

workspace.clientList().forEach(function(client) {
  print(client.caption+"\t\t"+client.resourceClass);
  if (! /.+{(Meta|Control|Alt+[-}]}$)/.test(client.caption)) {
    tagClient(client);
  }
});


add2windowgroup("browser",  /chromium-browser/);
add2windowgroup("browser",  /firefox/);
add2windowgroup("browser",  /opera/);
add2windowgroup("console",  /konsole/);
add2windowgroup("desktop",  /plasma(|-desktop)/, /plasma-desktop/);
add2windowgroup("editor",   /kate/);
add2windowgroup("devjava",  /eclipse/);
add2windowgroup("devkde",   /kdevelop/);
add2windowgroup("devkde",   /plasma(|-desktop)/, /Desktop Shell Scripting Console . Plasma Desktop Shell/);
add2windowgroup("devkde",   /plasmate/);
add2windowgroup("music",    /amarok/);
add2windowgroup("music",    /vlc/);
add2windowgroup("settings", /systemsettings/);
add2windowgroup("settings", /kcmshell4/); //individual modules
add2windowgroup("virtual",  /virtualbox/);
add2windowgroup("virtual",  /wine/, /.*TeamViewer.*/);
add2windowgroup("writer",   /libreoffice-writer/);
add2windowgroup("calc",     /libreoffice-calc/);
add2windowgroup("present",  /libreoffice-impress/);
add2windowgroup("draw",     /libreoffice-draw/);
add2windowgroup("base",     /libreoffice-base/);
add2windowgroup("math",     /libreoffice-math/);

registerBoth("Meta+F", "browser",  "chromium-browser");
registerBoth("Meta+Z", "console",  "konsole");
//register    ("Meta+D", "desktop");
registerBoth("Meta+J", "devjava",  "eclipse");
registerBoth("Meta+Y", "devkde",   "kdevelop");
registerBoth("Meta+E", "explorer", "dolphin");
registerBoth("Meta+N", "editor",   "kate");
registerBoth("Meta+/", "music",    "amarok"); //vlc ?
registerBoth("Meta+S", "settings", "systemsettings");
registerBoth("Meta+W", "writer",   "libreoffice --writer");
registerBoth("Meta+X", "calc",     "libreoffice --calc");
registerBoth("Meta+P", "present",  "libreoffice --impress");
registerBoth("Meta+P", "draw",     "libreoffice --draw");
registerBoth("Meta+B", "base",     "libreoffice --base");
registerBoth("Meta+M", "math",     "libreoffice --math");

registerShortcut("Toggle desktop", "", "Meta+D", function() {
  workspace.slotToggleShowDesktop();
});

launch("konsole");

//workspace.slotToggleShowDesktop();
kwinactivate("browser");

print(""); print("");
kwinactivate("devkde");

