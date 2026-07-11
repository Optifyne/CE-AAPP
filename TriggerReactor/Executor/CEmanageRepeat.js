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
var Runnable = Java.type("java.lang.Runnable");
var AtomicBoolean = Java.type("java.util.concurrent.atomic.AtomicBoolean");
var AtomicInteger = Java.type("java.util.concurrent.atomic.AtomicInteger");

var repeatConsole = Bukkit.getConsoleSender();
var repeatScheduler = Bukkit.getScheduler();
var repeatPlugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");

var repeatRunContexts = new ConcurrentHashMap();
var repeatRunningAsyncKeys = new ConcurrentHashMap();

var repeatRunContextsSync = new ConcurrentHashMap();
var repeatRunningSyncKeys = new ConcurrentHashMap();

function repeatDispatchSync(cmd) {
    if (Bukkit.isPrimaryThread()) {
        try { Bukkit.dispatchCommand(repeatConsole, cmd); } catch (e) {}
    } else {
        repeatScheduler.runTask(repeatPlugin, new (Java.extend(Runnable, {
            run: function () { try { Bukkit.dispatchCommand(repeatConsole, cmd); } catch (e) {} }
        }))());
    }
}

function repeatBuildCall(ctx, asyncKey, asyncPeriod, asyncInitialDelay, mode, isEnd) {
    var index = ctx.state.i;
    var extraVariables = ctx.state.extraVariables ? ";" + ctx.state.extraVariables.replace(/\$ind@/g, index) : "";
    var player = ctx.state.playerName ? (" player:" + ctx.state.playerName.replace(/\$ind@/g, index)) : "";

    return "ce call " + ctx.state.call
        + " %i%=" + index
        + ";%c%=" + ctx.repeatName
        + ";%ak%=" + (asyncKey ? asyncKey : "")
        + ";%p%=" + asyncPeriod
        + ";%sd%=" + asyncInitialDelay
        + ";%m%=" + mode
        + ";%l%=" + ctx.state.count
        + ";%end%=" + (isEnd ? "true" : "false")
        + ";%start%=" + (ctx.state.started ? "false" : "true")
        + extraVariables
        + player
        + " silent:true";
}

function cancelRepeatContextByKey(asyncKey) {
    var ctx = repeatRunContexts.get(asyncKey);
    if (!ctx) return false;
    try { if (ctx.task) ctx.task.cancel(); } catch (e) {}
    ctx.state.finished = true;
    repeatRunContexts.remove(asyncKey);
    repeatRunningAsyncKeys.remove(asyncKey + "|run");
    try { ctx.scheduled.set(false); ctx.pending.set(0); } catch (e2) {}
    return true;
}

function cancelAllRepeatsByName(repeatName) {
    var toCancel = new java.util.ArrayList();
    var it = repeatRunContexts.entrySet().iterator();
    while (it.hasNext()) {
        var e = it.next();
        var k = e.getKey();
        var v = e.getValue();
        if (v && v.repeatName === repeatName) toCancel.add(k);
    }
    var it2 = toCancel.iterator();
    while (it2.hasNext()) cancelRepeatContextByKey(it2.next());
}

function cancelRepeatSyncByName(repeatName) {
    var ctx = repeatRunContextsSync.get(repeatName);
    if (ctx) {
        try { if (ctx.task) ctx.task.cancel(); } catch (e) {}
        ctx.state.finished = true;
        repeatRunContextsSync.remove(repeatName);
        repeatRunningSyncKeys.remove(repeatName + "|run");
        return true;
    }
    return false;
}

function makeRepeatMainStepRunnable(ctx, asyncKey, asyncPeriod, asyncInitialDelay) {
    return new (Java.extend(Runnable, {
        run: function () {
            if (ctx.state.finished) { cancelRepeatContextByKey(asyncKey); return; }
            if (ctx.state.i >= ctx.state.count) { cancelRepeatContextByKey(asyncKey); return; }

            var isEnd = ctx.state.i >= ctx.state.count - 1;
            repeatDispatchSync(repeatBuildCall(ctx, asyncKey, asyncPeriod, asyncInitialDelay, "ASYNC", isEnd));

            if (!ctx.state.started) ctx.state.started = true;

            if (isEnd) {
                cancelRepeatContextByKey(asyncKey);
                return;
            }

            ctx.state.i += 1;

            var left = ctx.pending.decrementAndGet();
            if (!ctx.state.finished && left > 0) {
                repeatScheduler.runTask(repeatPlugin, makeRepeatMainStepRunnable(ctx, asyncKey, asyncPeriod, asyncInitialDelay));
            } else {
                ctx.scheduled.set(false);
            }
        }
    }))();
}

function CEmanageRepeat() {
    var ManageRepeatAction = Java.extend(ConditionalEventsAction, {
        execute: function (player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 3) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: Invalid format! Correct format: manage_repeat: <mode (SYNC(optional)~initialTicks(optional)@ticks|FORCESYNC(optional)~initialTicks(optional)@ticks|ASYNC(optional)=key(optional)~initialTicks(optional)@ticks)|FORCEASYNC(optional)=key(optional)~initialTicks(optional)@ticks>;<action (run or break)>;<repeat_name>;(only in case of run action) <count>;(only in case of run action) <call_event>;(optional, only in case of run action) <player_name>;(optional, only in case of run action) <extra_variables>");
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
                Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: First argument must be SYNC/FORCESYNC/ASYNC/FORCEASYNC with optional @ticks and ~startDelay.");
                return;
            }
            if (!(asyncPeriod >= 1)) asyncPeriod = 1;
            if (!(asyncInitialDelay >= 0)) asyncInitialDelay = 0;

            if (args.length <= idx) { Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: Missing action."); return; }

            var action = args[idx].trim().toLowerCase();
            if (!action || ((action === "run" && args.length < idx + 5) ||
                            (action === "break" && args.length < idx + 2))) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: Invalid format! Correct format: manage_repeat: <mode (SYNC(optional)~initialTicks(optional)@ticks|FORCESYNC(optional)~initialTicks(optional)@ticks|ASYNC(optional)=key(optional)~initialTicks(optional)@ticks)|FORCEASYNC(optional)=key(optional)~initialTicks(optional)@ticks>;<action (run or break)>;<repeat_name>;(only in case of run action) <count>;(only in case of run action) <call_event>;(optional, only in case of run action) <player_name>;(optional, only in case of run action) <extra_variables>");
                return;
            }

            var repeatName = args[idx + 1];
            if (action === "run") {
                if (asyncMode && !asyncKeyExplicit) asyncKey = repeatName;
            }

            if (action === "break") {
                if (asyncMode) {
                    if (asyncKeyExplicit) cancelRepeatContextByKey(asyncKey);
                    else cancelAllRepeatsByName(repeatName);
                } else {
                    cancelRepeatSyncByName(repeatName);
                }
                return;
            }

            if (action === "run") {
                var count = parseInt(args[idx + 2]);
                if (isNaN(count) || count <= 0) { Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: Count must be a positive number!"); return; }

                var call = args[idx + 3].trim();
                var repeatPlayer = args.length > idx + 4 ? args[idx + 4].trim() : null;
                var extraVariables = args.length > idx + 5 ? args[idx + 5].replaceAll("`", ";") : null;

                if (!asyncMode && forceSync) {
                    cancelRepeatSyncByName(repeatName);
                }

                if (asyncMode && forceAsync && !asyncKeyExplicit) { cancelAllRepeatsByName(repeatName); asyncKey = repeatName; }
                else if (asyncMode && forceAsync && asyncKeyExplicit) { cancelRepeatContextByKey(asyncKey); }

                if (!asyncMode) {
                    if (syncImmediate) {
                        var immediateCtx = {
                            repeatName: repeatName,
                            state: {
                                i: 0,
                                count: count,
                                call: call,
                                playerName: repeatPlayer,
                                extraVariables: extraVariables,
                                started: false,
                                finished: false
                            }
                        };

                        for (var i = 0; i < count; i++) {
                            immediateCtx.state.i = i;
                            repeatDispatchSync(repeatBuildCall(immediateCtx, null, 1, 0, "SYNC", i >= count - 1));
                            if (!immediateCtx.state.started) immediateCtx.state.started = true;
                        }
                        return;
                    }

                    var uniqueSyncKey = repeatName + "|run";
                    if (repeatRunningSyncKeys.putIfAbsent(uniqueSyncKey, true) !== null) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: SYNC task for repeat '" + repeatName + "' already running.");
                        return;
                    }

                    var ctxS = {
                        repeatName: repeatName,
                        state: {
                            i: 0,
                            count: count,
                            call: call,
                            playerName: repeatPlayer,
                            extraVariables: extraVariables,
                            started: false,
                            finished: false
                        },
                        task: null
                    };

                    function cancelTaskSyncLocal() {
                        try { if (ctxS.task) ctxS.task.cancel(); } catch (e) {}
                        repeatRunningSyncKeys.remove(uniqueSyncKey);
                        repeatRunContextsSync.remove(repeatName);
                    }

                    repeatRunContextsSync.put(repeatName, ctxS);

                    ctxS.task = repeatScheduler.runTaskTimer(
                        repeatPlugin,
                        new (Java.extend(Runnable, {
                            run: function () {
                                if (ctxS.state.finished) { cancelTaskSyncLocal(); return; }
                                if (ctxS.state.i >= ctxS.state.count) { ctxS.state.finished = true; cancelTaskSyncLocal(); return; }

                                var isEnd = ctxS.state.i >= ctxS.state.count - 1;
                                repeatDispatchSync(repeatBuildCall(ctxS, null, asyncPeriod, asyncInitialDelay, "SYNC", isEnd));

                                if (!ctxS.state.started) ctxS.state.started = true;

                                if (isEnd) {
                                    ctxS.state.finished = true;
                                    cancelTaskSyncLocal();
                                    return;
                                }

                                ctxS.state.i += 1;
                            }
                        }))(),
                        asyncInitialDelay,
                        asyncPeriod
                    );

                    return;
                }

                var uniqueKey = asyncKey + "|run";
                if (repeatRunningAsyncKeys.putIfAbsent(uniqueKey, true) !== null) {
                    Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: Task with key '" + asyncKey + "' already running. uniqueKey=" + uniqueKey);
                    return;
                }

                var ctx = {
                    repeatName: repeatName,
                    state: {
                        i: 0,
                        count: count,
                        call: call,
                        playerName: repeatPlayer,
                        extraVariables: extraVariables,
                        started: false,
                        finished: false
                    },
                    pending: new AtomicInteger(0),
                    scheduled: new AtomicBoolean(false),
                    task: null
                };

                function cancelTask() {
                    try { if (ctx.task) ctx.task.cancel(); } catch (e) {}
                    repeatRunningAsyncKeys.remove(uniqueKey);
                    repeatRunContexts.remove(asyncKey);
                    try { ctx.scheduled.set(false); ctx.pending.set(0); } catch (e) {}
                }

                repeatRunContexts.put(asyncKey, ctx);

                ctx.task = repeatScheduler.runTaskTimerAsynchronously(
                    repeatPlugin,
                    new (Java.extend(Runnable, {
                        run: function () {
                            if (ctx.state.finished) { cancelTask(); return; }
                            ctx.pending.incrementAndGet();
                            if (ctx.scheduled.compareAndSet(false, true)) {
                                repeatScheduler.runTask(repeatPlugin, makeRepeatMainStepRunnable(ctx, asyncKey, asyncPeriod, asyncInitialDelay));
                            }
                        }
                    }))(),
                    asyncInitialDelay,
                    asyncPeriod
                );

                return;
            }

            Bukkit.getLogger().warning("[CEActions] MANAGE_REPEAT ACTION: Invalid action.");
        }
    });

    var manageRepeatInstance = new ManageRepeatAction("manage_repeat");
    
    return manageRepeatInstance;
}

CEmanageRepeat();
