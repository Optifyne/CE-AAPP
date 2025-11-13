/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var ConcurrentHashMap = Java.type("java.util.concurrent.ConcurrentHashMap");
var ConcurrentLinkedQueue = Java.type("java.util.concurrent.ConcurrentLinkedQueue");
var ArrayList = Java.type("java.util.ArrayList");
var Collectors = Java.type("java.util.stream.Collectors");
var Runnable = Java.type("java.lang.Runnable");
var HashSet = Java.type("java.util.HashSet");
var AtomicBoolean = Java.type("java.util.concurrent.atomic.AtomicBoolean");
var AtomicInteger = Java.type("java.util.concurrent.atomic.AtomicInteger");

var console = Bukkit.getConsoleSender();
var scheduler = Bukkit.getScheduler();
var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");

var cycles = new ConcurrentHashMap();
var cyclesUpdate = new ConcurrentHashMap();
var cyclesLastOp = new ConcurrentHashMap();

var runContexts = new ConcurrentHashMap();
var runningAsyncKeys = new ConcurrentHashMap();

var runContextsSync = new ConcurrentHashMap();
var runningSyncKeys = new ConcurrentHashMap();

function dispatchSync(cmd) {
    if (Bukkit.isPrimaryThread()) {
        try { Bukkit.dispatchCommand(console, cmd); } catch (e) {}
    } else {
        scheduler.runTask(plugin, new (Java.extend(Runnable, {
            run: function () { try { Bukkit.dispatchCommand(console, cmd); } catch (e) {} }
        }))());
    }
}

function buildJoined(a, sep) {
    return a.stream().map(String).collect(Collectors.joining(sep));
}

function storeKeyOf(cycleName, asyncMode, asyncKey) {
    return asyncMode ? (cycleName + "|AK:" + asyncKey) : (cycleName + "|SYNC");
}

function allAsyncStoreKeysForCycle(cycleName) {
    var keys = new java.util.ArrayList();
    var it = cycles.keySet().iterator();
    var prefix = cycleName + "|AK:";
    while (it.hasNext()) {
        var k = it.next();
        if (String(k).startsWith(prefix)) keys.add(k);
    }
    return keys;
}

function applyUpdateCOW(storeKey, changeSpec) {
    var current = cycles.containsKey(storeKey) ? cycles.get(storeKey) : null;
    if (!current) return;
    var array = new ArrayList(current);
    var parts = changeSpec.split(":");
    var action = parts[0].trim().toUpperCase();
    switch (action) {
        case "ADD-BY-INDEX":
        case "ABI": {
            if (parts.length < 3) return;
            var idx = parts[1] === "~" ? array.size() : parseInt(parts[1]);
            var val = parts[2];
            array.add(idx, val);
            cyclesLastOp.put(storeKey, "ABI:" + idx);
            break;
        }
        case "SET-BY-INDEX":
        case "SBI": {
            if (parts.length < 3) return;
            var idx2 = parts[1] === "~" ? array.size() - 1 : parseInt(parts[1]);
            var val2 = parts[2];
            array.set(idx2, val2);
            break;
        }
        case "SET-BY-VALUE":
        case "SBV": {
            if (parts.length < 3) return;
            var oldV = String(parts[1]);
            var newV = parts[2];
            for (var i = 0; i < array.size(); i++) {
                var cur = String(array.get(i));
                if (cur.equals(oldV)) array.set(i, newV);
            }
            break;
        }
        case "SET-RANGE":
        case "SR": {
            if (parts.length < 4) return;
            var s = parts[1] === "~" ? array.size() - 1 : parseInt(parts[1]);
            var e = parts[2] === "~" ? array.size() - 1 : parseInt(parts[2]);
            var v = parts[3];
            s = Math.max(0, Math.min(s, array.size() - 1));
            e = Math.max(0, Math.min(e, array.size() - 1));
            if (s > e) { var t = s; s = e; e = t; }
            for (var j = s; j <= e; j++) array.set(j, v);
            break;
        }
        case "REMOVE-BY-INDEX":
        case "RBI": {
            if (parts.length < 2) return;
            var idx3 = parts[1] === "~" ? array.size() - 1 : parseInt(parts[1]);
            array.remove(idx3);
            cyclesLastOp.put(storeKey, "RBI:" + idx3);
            break;
        }
        default: return;
    }
    cycles.put(storeKey, array);
    cyclesUpdate.put(storeKey, true);
}

function drainOpsBeforeIteration(ctx) {
    var op;
    while ((op = ctx.queue.poll()) != null) {
        if (op.type === "update") {
            applyUpdateCOW(ctx.storeKey, op.changeSpec);
        } else if (op.type === "break") {
            if (cycles.containsKey(ctx.storeKey)) {
                cycles.remove(ctx.storeKey);
                cyclesUpdate.put(ctx.storeKey, true);
            }
            ctx.state.finished = true;
        }
    }
}

function cancelContextByKey(asyncKey) {
    var ctx = runContexts.get(asyncKey);
    if (!ctx) return false;
    try { if (ctx.task) ctx.task.cancel(); } catch (e) {}
    runContexts.remove(asyncKey);
    runningAsyncKeys.remove(asyncKey + "|run");
    try {
        if (ctx.storeKey && cycles.containsKey(ctx.storeKey)) {
            cycles.remove(ctx.storeKey);
            cyclesUpdate.put(ctx.storeKey, true);
        }
    } catch (e) {}
    return true;
}

function cancelAllByCycleName(cycleName) {
    var toCancel = new java.util.ArrayList();
    var it = runContexts.entrySet().iterator();
    while (it.hasNext()) {
        var e = it.next();
        var k = e.getKey();
        var v = e.getValue();
        if (v && v.cycleName === cycleName) toCancel.add(k);
    }
    var it2 = toCancel.iterator();
    while (it2.hasNext()) cancelContextByKey(it2.next());

    var keys = allAsyncStoreKeysForCycle(cycleName);
    var it3 = keys.iterator();
    while (it3.hasNext()) {
        var sk = it3.next();
        if (cycles.containsKey(sk)) {
            cycles.remove(sk);
            cyclesUpdate.put(sk, true);
        }
    }
}

function cancelSyncByCycle(cycleName) {
    var ctx = runContextsSync.get(cycleName);
    if (ctx) {
        try { if (ctx.task) ctx.task.cancel(); } catch (e) {}
        runContextsSync.remove(cycleName);
        runningSyncKeys.remove(cycleName + "|run");
    }
    try {
        var sk = storeKeyOf(cycleName, false, null);
        if (cycles.containsKey(sk)) {
            cycles.remove(sk);
        }
        cyclesUpdate.put(sk, true);
        cyclesLastOp.remove(sk);
    } catch (e) {}
    return true;
}

function makeMainStepRunnable(ctx, asyncKey, asyncPeriod, asyncInitialDelay) {
    return new (Java.extend(Runnable, {
        run: function () {
            if (ctx.state.finished) { cancelContextByKey(asyncKey); return; }

            drainOpsBeforeIteration(ctx);
            if (ctx.state.finished) { cancelContextByKey(asyncKey); return; }

            var arrayLocal = cycles.get(ctx.storeKey);
            if (!arrayLocal) { cancelContextByKey(asyncKey); return; }

            if (cyclesUpdate.get(ctx.storeKey) === true) {
                cyclesUpdate.put(ctx.storeKey, false);
                var info = cyclesLastOp.get(ctx.storeKey);
                if (info) {
                    var pp = info.split(":");
                    var op = pp[0]; var idxOp = parseInt(pp[1]);
                    if (op === "RBI") {
                        if (ctx.state.forward) {
                            if (idxOp < ctx.state.i) ctx.state.i -= 1;
                            if (idxOp <= ctx.state.i2) ctx.state.i2 -= 1;
                        } else { if (idxOp > ctx.state.i) ctx.state.i += 1; }
                    } else if (op === "ABI") {
                        if (ctx.state.forward) {
                            if (idxOp <= ctx.state.i) ctx.state.i += 1;
                            if (idxOp <= ctx.state.i2) ctx.state.i2 += 1;
                        } else { if (idxOp >= ctx.state.i) ctx.state.i -= 1; }
                    }
                    cyclesLastOp.remove(ctx.storeKey);
                }

                arrayLocal = cycles.get(ctx.storeKey);
                if (!arrayLocal || arrayLocal.size() === 0) { cancelContextByKey(asyncKey); return; }

                if (ctx.state.i < 0) ctx.state.i = 0;
                if (ctx.state.i >= arrayLocal.size()) ctx.state.i = (ctx.state.forward) ? arrayLocal.size() - 1 : 0;
                if (ctx.state.i2 < 0) ctx.state.i2 = 0;
                if (ctx.state.i2 >= arrayLocal.size()) ctx.state.i2 = arrayLocal.size() - 1;

                if (ctx.state.forward ? (ctx.state.i > ctx.state.i2) : (ctx.state.i < ctx.state.i2)) {
                    cancelContextByKey(asyncKey);
                    return;
                }
            }

            var outputArray = buildJoined(arrayLocal, ctx.state.separator);
            if (ctx.state.i < 0 || ctx.state.i >= arrayLocal.size()) { cancelContextByKey(asyncKey); return; }

            var val = arrayLocal.get(ctx.state.i);
            if (val == null) { cancelContextByKey(asyncKey); return; }

            var atBoundary = (ctx.state.i === ctx.state.i2);
            var next = ctx.state.i + ctx.state.step;
            var willOvershoot = ctx.state.forward ? (next > ctx.state.i2) : (next < ctx.state.i2);

            var nextInArray = ctx.state.forward ? (next < arrayLocal.size()) : (next >= 0);
            var notAtBoundary = ctx.state.forward ? (ctx.state.i < ctx.state.i2) : (ctx.state.i > ctx.state.i2);
            var isEndForCurrent = atBoundary || (!nextInArray && !(willOvershoot && notAtBoundary));

            if (isEndForCurrent && !(willOvershoot && notAtBoundary)) {
                cancelContextByKey(asyncKey);
                dispatchSync(
                    "ce call " + ctx.state.call
                    + " %i%=" + ctx.state.i
                    + ";%v%=" + val
                    + ";%s%=" + ctx.state.step
                    + ";%c%=" + ctx.cycleName
                    + ";%ak%=" + asyncKey
                    + ";%p%=" + asyncPeriod
                    + ";%sd%=" + asyncInitialDelay
                    + ";%m%=ASYNC"
                    + ";%a%=" + outputArray
                    + ";%l%=" + arrayLocal.size()
                    + ";%f%=" + (ctx.state.forward ? "+" : "-")
                    + ";%i1%=" + ctx.state.i
                    + ";%i2%=" + ctx.state.i2
                    + ";%end%=true"
                    + ";%start%=" + (ctx.state.started ? "false" : "true")
                    + ";%o%=false"
                    + (ctx.state.playerName ? (" player:" + ctx.state.playerName) : "")
                    + " silent:true"
                );
                return;
            }

            dispatchSync(
                "ce call " + ctx.state.call
                + " %i%=" + ctx.state.i
                + ";%v%=" + val
                + ";%s%=" + ctx.state.step
                + ";%c%=" + ctx.cycleName
                + ";%ak%=" + asyncKey
                + ";%p%=" + asyncPeriod
                + ";%sd%=" + asyncInitialDelay
                + ";%m%=ASYNC"
                + ";%a%=" + outputArray
                + ";%l%=" + arrayLocal.size()
                + ";%f%=" + (ctx.state.forward ? "+" : "-")
                + ";%i1%=" + ctx.state.i
                + ";%i2%=" + ctx.state.i2
                + ";%end%=false"
                + ";%start%=" + (ctx.state.started ? "false" : "true")
                + ";%o%=false"
                + (ctx.state.playerName ? (" player:" + ctx.state.playerName) : "")
                + " silent:true"
            );
            if (!ctx.state.started) ctx.state.started = true;

            if (willOvershoot && notAtBoundary) {
                cancelContextByKey(asyncKey);
                dispatchSync(
                    "ce call " + ctx.state.call
                    + " %i%=" + ctx.state.i
                    + ";%v%=" + val
                    + ";%s%=" + ctx.state.step
                    + ";%c%=" + ctx.cycleName
                    + ";%ak%=" + asyncKey
                    + ";%p%=" + asyncPeriod
                    + ";%sd%=" + asyncInitialDelay
                    + ";%m%=ASYNC"
                    + ";%a%=" + outputArray
                    + ";%l%=" + arrayLocal.size()
                    + ";%f%=" + (ctx.state.forward ? "+" : "-")
                    + ";%i1%=" + ctx.state.i
                    + ";%i2%=" + ctx.state.i2
                    + ";%end%=true"
                    + ";%start%=" + (ctx.state.started ? "false" : "true")
                    + ";%o%=true"
                    + (ctx.state.playerName ? (" player:" + ctx.state.playerName) : "")
                    + " silent:true"
                );
                return;
            }

            ctx.state.i += ctx.state.step;
            
            var left = ctx.pending.decrementAndGet();
            if (!ctx.state.finished && left > 0) {
                scheduler.runTask(plugin, makeMainStepRunnable(ctx, asyncKey, asyncPeriod, asyncInitialDelay));
            } else {
                ctx.scheduled.set(false);
            }
        }
    }))();
}

function CEmanageCycle() {
    var ManageCycleAction = Java.extend(ConditionalEventsAction, {
        execute: function (player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Invalid format! Correct format: manage_cycle: <mode (SYNC(optional)~initialTicks(optional)@ticks|FORCESYNC(optional)~initialTicks(optional)@ticks|ASYNC(optional)=key(optional)~initialTicks(optional)@ticks)|FORCEASYNC(optional)=key(optional)~initialTicks(optional)@ticks>;<action (update, run or break)>;<cycle_name>;(only in case of update action) <changes (for example, ABI(the same as ADD-BY-INDEX):<index>:<value>)>;(only in case of run action) <from_index>;(only in case of run action) <to_index>;(only in case of run action) <step>;(only in case of run action) <array_separator (separator symbol in the array)>;(only in case of run action) <array>;(only in case of run action) <call_event (call event name to call)>;(optional, only in case of run action) <player_name (to call the event for player)>");
                return;
            }

            var first = args[0] ? args[0].trim() : "";
            var idx = 1, asyncMode = false, forceAsync = false, forceSync = false, asyncKey = null, asyncPeriod = 1, asyncInitialDelay = 0;
            var asyncKeyExplicit = false;
            var syncImmediate = false;

            if (/^FORCEASYNC/i.test(first)) {
                asyncMode = true;
                forceAsync = true;
                var restF = first.replace(/^FORCEASYNC/i, "");
                var mKeyF = restF.match(/[=:]\s*([^@~]+)/);
                if (mKeyF) { asyncKey = (""+mKeyF[1]).trim(); asyncKeyExplicit = true; }
                var mAtF = restF.match(/@(\d+)/);  if (mAtF) asyncPeriod = parseInt(mAtF[1]);
                var mTildeF = restF.match(/~(\d+)/);if (mTildeF) asyncInitialDelay = parseInt(mTildeF[1]);
            } else if (/^FORCESYNC/i.test(first)) {
                asyncMode = false;
                forceSync = true;
                var restFS = first.replace(/^FORCESYNC/i, "");
                syncImmediate = true;
                var mAtFS = restFS.match(/@(\d+)/);
                if (mAtFS) { asyncPeriod = parseInt(mAtFS[1]); syncImmediate = false; }
                var mTildeFS = restFS.match(/~(\d+)/);
                if (mTildeFS) { asyncInitialDelay = parseInt(mTildeFS[1]); syncImmediate = false; }
            } else if (/^ASYNC/i.test(first)) {
                asyncMode = true;
                var restA = first.replace(/^ASYNC/i, "");
                var mKeyA = restA.match(/[=:]\s*([^@~]+)/);
                if (mKeyA) { asyncKey = (""+mKeyA[1]).trim(); asyncKeyExplicit = true; }
                var mAtA = restA.match(/@(\d+)/);   if (mAtA) asyncPeriod = parseInt(mAtA[1]);
                var mTildeA = restA.match(/~(\d+)/);if (mTildeA) asyncInitialDelay = parseInt(mTildeA[1]);
            } else if (/^SYNC/i.test(first)) {
                asyncMode = false;
                var restS = first.replace(/^SYNC/i, "");
                syncImmediate = true;
                var mAtS = restS.match(/@(\d+)/);
                if (mAtS) { asyncPeriod = parseInt(mAtS[1]); syncImmediate = false; }
                var mTildeS = restS.match(/~(\d+)/);
                if (mTildeS) { asyncInitialDelay = parseInt(mTildeS[1]); syncImmediate = false; }
            } else {
                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: First argument must be SYNC/FORCESYNC/ASYNC/FORCEASYNC with optional @ticks and ~startDelay.");
                return;
            }
            if (!(asyncPeriod >= 1)) asyncPeriod = 1;
            if (!(asyncInitialDelay >= 0)) asyncInitialDelay = 0;

            if (args.length <= idx) { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Missing action."); return; }

            var action = args[idx].trim().toLowerCase();
            if (!action || ((action === "run" && args.length < idx + 8) ||
                            (action === "update" && args.length < idx + 3) ||
                            (action === "break" && args.length < idx + 2))) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Invalid format! Correct format: manage_cycle: <mode (SYNC(optional)~initialTicks(optional)@ticks|FORCESYNC(optional)~initialTicks(optional)@ticks|ASYNC(optional)=key(optional)~initialTicks(optional)@ticks)|FORCEASYNC(optional)=key(optional)~initialTicks(optional)@ticks>;<action (update, run or break)>;<cycle_name>;(only in case of update action) <changes (for example, ABI(the same as ADD-BY-INDEX):<index>:<value>)>;(only in case of run action) <from_index>;(only in case of run action) <to_index>;(only in case of run action) <step>;(only in case of run action) <array_separator (separator symbol in the array)>;(only in case of run action) <array>;(only in case of run action) <call_event (call event name to call)>;(optional, only in case of run action) <player_name (to call the event for player)>");
                return;
            }

            var cycleName = args[idx + 1];
            if (action === "run") {
                if (asyncMode && !asyncKeyExplicit) asyncKey = cycleName;
            }

            var storeKey = (!asyncMode || (asyncMode && asyncKeyExplicit))
                ? storeKeyOf(cycleName, asyncMode, asyncKey)
                : null;

            if (action === "update") {
                var changeSpec = args[idx + 2];
                if (asyncMode) {
                    if (asyncKeyExplicit) {
                        var ctx = runContexts.get(asyncKey);
                        if (ctx && ctx.storeKey === storeKey) { ctx.queue.add({ type: "update", changeSpec: changeSpec }); return; }
                        scheduler.runTaskAsynchronously(plugin, new (Java.extend(Runnable, { run: function () { applyUpdateCOW(storeKey, changeSpec); } }))());
                    } else {
                        var keys = allAsyncStoreKeysForCycle(cycleName);
                        if (keys.size() === 0) return;
                        var activeStoreKeys = new HashSet();
                        var itCtx = runContexts.entrySet().iterator();
                        while (itCtx.hasNext()) {
                            var e = itCtx.next();
                            var ctxAny = e.getValue();
                            if (ctxAny && ctxAny.cycleName === cycleName) {
                                ctxAny.queue.add({ type: "update", changeSpec: changeSpec });
                                activeStoreKeys.add(ctxAny.storeKey);
                            }
                        }
                        scheduler.runTaskAsynchronously(plugin, new (Java.extend(Runnable, {
                            run: function () {
                                var it2 = keys.iterator();
                                while (it2.hasNext()) {
                                    var sk = it2.next();
                                    if (!activeStoreKeys.contains(sk) && cycles.containsKey(sk)) {
                                        applyUpdateCOW(sk, changeSpec);
                                    }
                                }
                            }
                        }))());
                    }
                } else {
                    applyUpdateCOW(storeKey, changeSpec);
                }
                return;
            }

            if (action === "break") {
                if (asyncMode) {
                    if (asyncKeyExplicit) {
                        var cancelled = cancelContextByKey(asyncKey);
                        if (!cancelled) {
                            var sk = storeKeyOf(cycleName, true, asyncKey);
                            if (cycles.containsKey(sk)) {
                                cycles.remove(sk);
                                cyclesUpdate.put(sk, true);
                            }
                        }
                    } else {
                        cancelAllByCycleName(cycleName);
                    }
                } else {
                    cancelSyncByCycle(cycleName);
                }
                return;
            }

            if (action === "run") {
                var i1 = args[idx + 2].trim().toLowerCase() === "last" ? "last" : parseInt(args[idx + 2]);
                var i2 = args[idx + 3].trim().toLowerCase() === "last" ? "last" : parseInt(args[idx + 3]);
                var step = parseInt(args[idx + 4]);

                if ((isNaN(i1) && i1 !== "last") || (isNaN(i2) && i2 !== "last") || isNaN(step)) { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Indexes and step must be numbers!"); return; }
                if (step === 0) { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Step can not be zero!"); return; }

                var separator = args[idx + 5];
                if (separator === ";") { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Separator can not be ';'!"); return; }

                var array = new ArrayList(args[idx + 6].split(separator));
                if (i1 === "last") i1 = array.size() - 1;
                if (i2 === "last") i2 = array.size() - 1;

                if (i1 < 0 || i2 < 0) { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Indexes must be >= 0!"); return; }
                if (i1 > i2 && step > 0) { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Start > end, step must be negative!"); return; }
                if (i1 < i2 && step < 0) { Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Start < end, step must be positive!"); return; }

                var call = args[idx + 7].trim();
                player = args.length > idx + 8 ? args[idx + 8].trim() : null;
                
                if (!asyncMode && forceSync) {
                    cancelSyncByCycle(cycleName);
                    var skSync = storeKeyOf(cycleName, false, null);
                    cyclesUpdate.remove(skSync);
                    cyclesLastOp.remove(skSync);
                }

                if (asyncMode && forceAsync && !asyncKeyExplicit) { cancelAllByCycleName(cycleName); asyncKey = cycleName; }
                else if (asyncMode && forceAsync && asyncKeyExplicit) { cancelContextByKey(asyncKey); }

                var storeKeyRun = storeKeyOf(cycleName, asyncMode, asyncKey);
                cycles.put(storeKeyRun, array);
                var forward = step > 0;

                if (!asyncMode) {
                    if (syncImmediate) {
                        var outputArray = buildJoined(array, separator);
                        var started = false;

                        for (var i = i1; (forward ? (i <= i2) : (i >= i2)); i += step) {
                            if (cyclesUpdate.get(storeKeyRun) === true) {
                                array = cycles.get(storeKeyRun);
                                cyclesUpdate.put(storeKeyRun, false);
                                if (!array) break;

                                outputArray = buildJoined(array, separator);

                                var info = cyclesLastOp.get(storeKeyRun);
                                if (info) {
                                    var p = info.split(":"); var op = p[0], idxOp = parseInt(p[1]);
                                    if (op === "RBI") {
                                        if (forward) { if (idxOp < i) i -= 1; if (idxOp <= i2) i2 -= 1; }
                                        else { if (idxOp > i) i += 1; }
                                    } else if (op === "ABI") {
                                        if (forward) { if (idxOp <= i) i += 1; if (idxOp <= i2) i2 += 1; }
                                        else { if (idxOp >= i) i -= 1; }
                                    }
                                    cyclesLastOp.remove(storeKeyRun);
                                }

                                if (array.size() === 0) break;
                                if (i < 0) i = 0;
                                if (i >= array.size()) i = (forward) ? array.size() - 1 : 0;
                                if (i2 < 0) i2 = 0;
                                if (i2 >= array.size()) i2 = array.size() - 1;
                                if (forward ? (i > i2) : (i < i2)) break;
                            }

                            if (i < 0 || i >= array.size()) break;
                            var val = array.get(i); if (val == null) break;

                            var atBoundary = (i === i2);
                            var next = i + step;
                            var willOvershoot = forward ? (next > i2) : (next < i2);

                            var nextInArray = forward ? (next < array.size()) : (next >= 0);
                            var notAtBoundary = forward ? (i < i2) : (i > i2);
                            var isEndForCurrent = atBoundary || (!nextInArray && !(willOvershoot && notAtBoundary));

                            dispatchSync(
                                "ce call " + call
                                + " %i%=" + i
                                + ";%v%=" + val
                                + ";%s%=" + step
                                + ";%c%=" + cycleName
                                + ";%ak%="
                                + ";%p%=" + 1
                                + ";%sd%=" + 0
                                + ";%m%=SYNC"
                                + ";%a%=" + outputArray
                                + ";%l%=" + array.size()
                                + ";%f%=" + (forward ? "+" : "-")
                                + ";%i1%=" + i
                                + ";%i2%=" + i2
                                + ";%end%=" + (isEndForCurrent ? "true" : "false")
                                + ";%start%=" + (started ? "false" : "true")
                                + ";%o%=false"
                                + (player ? (" player:" + player) : "")
                                + " silent:true"
                            );

                            if (!started) started = true;

                            if (willOvershoot && notAtBoundary) {
                                dispatchSync(
                                    "ce call " + call
                                    + " %i%=" + i
                                    + ";%v%=" + val
                                    + ";%s%=" + step
                                    + ";%c%=" + cycleName
                                    + ";%ak%="
                                    + ";%p%=" + 1
                                    + ";%sd%=" + 0
                                    + ";%m%=SYNC"
                                    + ";%a%=" + outputArray
                                    + ";%l%=" + array.size()
                                    + ";%f%=" + (forward ? "+" : "-")
                                    + ";%i1%=" + i
                                    + ";%i2%=" + i2
                                    + ";%end%=true"
                                    + ";%start%=" + (started ? "false" : "true")
                                    + ";%o%=true"
                                    + (player ? (" player:" + player) : "")
                                    + " silent:true"
                                );
                                break;
                            }
                        }
                        return;
                    }

                    var uniqueSyncKey = cycleName + "|run";
                    if (runningSyncKeys.putIfAbsent(uniqueSyncKey, true) !== null) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: SYNC task for cycle '" + cycleName + "' already running.");
                        return;
                    }

                    var ctxS = {
                        cycleName: cycleName,
                        storeKey: storeKeyRun,
                        queue: new ConcurrentLinkedQueue(),
                        state: {
                            i: i1, i2: i2, step: step,
                            separator: separator,
                            call: call,
                            playerName: player,
                            forward: forward,
                            started: false,
                            finished: false
                        },
                        task: null
                    };

                    function cancelTaskSyncLocal() {
                        try { if (ctxS.task) ctxS.task.cancel(); } catch (e) {}
                        runningSyncKeys.remove(uniqueSyncKey);
                        runContextsSync.remove(cycleName);
                    }

                    runContextsSync.put(cycleName, ctxS);

                    ctxS.task = scheduler.runTaskTimer(
                        plugin,
                        new (Java.extend(Runnable, {
                            run: function () {
                                if (ctxS.state.finished) { cancelTaskSyncLocal(); return; }

                                var arrayLocal = cycles.get(ctxS.storeKey);
                                if (!arrayLocal) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }

                                if (cyclesUpdate.get(ctxS.storeKey) === true) {
                                    cyclesUpdate.put(ctxS.storeKey, false);

                                    var info = cyclesLastOp.get(ctxS.storeKey);
                                    if (info) {
                                        var pp = info.split(":");
                                        var op = pp[0]; var idxOp = parseInt(pp[1]);
                                        if (op === "RBI") {
                                            if (ctxS.state.forward) {
                                                if (idxOp < ctxS.state.i) ctxS.state.i -= 1;
                                                if (idxOp <= ctxS.state.i2) ctxS.state.i2 -= 1;
                                            } else {
                                                if (idxOp > ctxS.state.i) ctxS.state.i += 1;
                                            }
                                        } else if (op === "ABI") {
                                            if (ctxS.state.forward) {
                                                if (idxOp <= ctxS.state.i) ctxS.state.i += 1;
                                                if (idxOp <= ctxS.state.i2) ctxS.state.i2 += 1;
                                            } else {
                                                if (idxOp >= ctxS.state.i) ctxS.state.i -= 1;
                                            }
                                        }
                                        cyclesLastOp.remove(ctxS.storeKey);
                                    }

                                    arrayLocal = cycles.get(ctxS.storeKey);
                                    if (!arrayLocal) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }
                                    if (arrayLocal.size() === 0) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }

                                    if (ctxS.state.i < 0) ctxS.state.i = 0;
                                    if (ctxS.state.i >= arrayLocal.size()) ctxS.state.i = (ctxS.state.forward) ? arrayLocal.size() - 1 : 0;

                                    if (ctxS.state.i2 < 0) ctxS.state.i2 = 0;
                                    if (ctxS.state.i2 >= arrayLocal.size()) ctxS.state.i2 = arrayLocal.size() - 1;

                                    if (ctxS.state.forward ? (ctxS.state.i > ctxS.state.i2) : (ctxS.state.i < ctxS.state.i2)) { 
                                        ctxS.state.finished = true; cancelTaskSyncLocal(); return; 
                                    }
                                }

                                var outputArray = buildJoined(arrayLocal, ctxS.state.separator);
                                if (ctxS.state.i < 0 || ctxS.state.i >= arrayLocal.size()) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }

                                var val = arrayLocal.get(ctxS.state.i);
                                if (val == null) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }

                                var atBoundary = (ctxS.state.i === ctxS.state.i2);
                                var next = ctxS.state.i + ctxS.state.step;
                                var willOvershoot = ctxS.state.forward ? (next > ctxS.state.i2) : (next < ctxS.state.i2);

                                var nextInArray = ctxS.state.forward ? (next < arrayLocal.size()) : (next >= 0);
                                var notAtBoundary = ctxS.state.forward ? (ctxS.state.i < ctxS.state.i2) : (ctxS.state.i > ctxS.state.i2);
                                var isEndForCurrent = atBoundary || (!nextInArray && !(willOvershoot && notAtBoundary));

                                dispatchSync(
                                    "ce call " + ctxS.state.call
                                    + " %i%=" + ctxS.state.i
                                    + ";%v%=" + val
                                    + ";%s%=" + ctxS.state.step
                                    + ";%c%=" + ctxS.cycleName
                                    + ";%ak%="
                                    + ";%p%=" + asyncPeriod
                                    + ";%sd%=" + asyncInitialDelay
                                    + ";%m%=SYNC"
                                    + ";%a%=" + outputArray
                                    + ";%l%=" + arrayLocal.size()
                                    + ";%f%=" + (ctxS.state.forward ? "+" : "-")
                                    + ";%i1%=" + ctxS.state.i
                                    + ";%i2%=" + ctxS.state.i2
                                    + ";%end%=" + (isEndForCurrent ? "true" : "false")
                                    + ";%start%=" + (ctxS.state.started ? "false" : "true")
                                    + ";%o%=false"
                                    + (ctxS.state.playerName ? (" player:" + ctxS.state.playerName) : "")
                                    + " silent:true"
                                );

                                if (!ctxS.state.started) ctxS.state.started = true;

                                if (willOvershoot && notAtBoundary) {
                                    dispatchSync(
                                        "ce call " + ctxS.state.call
                                        + " %i%=" + ctxS.state.i
                                        + ";%v%=" + val
                                        + ";%s%=" + ctxS.state.step
                                        + ";%c%=" + ctxS.cycleName
                                        + ";%ak%="
                                        + ";%p%=" + asyncPeriod
                                        + ";%sd%=" + asyncInitialDelay
                                        + ";%m%=SYNC"
                                        + ";%a%=" + outputArray
                                        + ";%l%=" + arrayLocal.size()
                                        + ";%f%=" + (ctxS.state.forward ? "+" : "-")
                                        + ";%i1%=" + ctxS.state.i
                                        + ";%i2%=" + ctxS.state.i2
                                        + ";%end%=true"
                                        + ";%start%=" + (ctxS.state.started ? "false" : "true")
                                        + ";%o%=true"
                                        + (ctxS.state.playerName ? (" player:" + ctxS.state.playerName) : "")
                                        + " silent:true"
                                    );
                                    ctxS.state.finished = true; cancelTaskSyncLocal(); return;
                                }

                                ctxS.state.i += ctxS.state.step;
                                if (isEndForCurrent) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }
                            }
                        }))(),
                        asyncInitialDelay,
                        asyncPeriod
                    );

                    return;
                }

                var uniqueKey = asyncKey + "|run";
                if (runningAsyncKeys.putIfAbsent(uniqueKey, true) !== null) {
                    Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Task with key '" + asyncKey + "' already running. uniqueKey=" + uniqueKey);
                    return;
                }

                var ctx = {
                    cycleName: cycleName,
                    storeKey: storeKeyRun,
                    queue: new ConcurrentLinkedQueue(),
                    state: {
                        i: i1, i2: i2, step: step,
                        separator: separator,
                        call: call,
                        playerName: player,
                        forward: forward,
                        started: false,
                        finished: false
                    },
                    pending: new AtomicInteger(0),
                    scheduled: new AtomicBoolean(false),
                    task: null
                };

                function cancelTask() {
                    try { if (ctx.task) ctx.task.cancel(); } catch (e) {}
                    runningAsyncKeys.remove(uniqueKey);
                    runContexts.remove(asyncKey);
                    try { ctx.scheduled.set(false); ctx.pending.set(0); } catch (e) {}
                }

                runContexts.put(asyncKey, ctx);

                ctx.task = scheduler.runTaskTimerAsynchronously(
                    plugin,
                    new (Java.extend(Runnable, {
                        run: function () {
                            if (ctx.state.finished) { cancelTask(); return; }
                            ctx.pending.incrementAndGet();
                            if (ctx.scheduled.compareAndSet(false, true)) {
                                scheduler.runTask(plugin, makeMainStepRunnable(ctx, asyncKey, asyncPeriod, asyncInitialDelay));
                            }
                        }
                    }))(),
                    asyncInitialDelay,
                    asyncPeriod
                );

                return;
            }

            Bukkit.getLogger().warning("[CEActions] MANAGE_CYCLE ACTION: Invalid action.");
        }
    });

    var manageCycleInstance = new ManageCycleAction("manage_cycle");
    
    return manageCycleInstance;
}

CEmanageCycle();