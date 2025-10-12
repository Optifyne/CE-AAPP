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
var Mob = Java.type("org.bukkit.entity.Mob");
var Player = Java.type("org.bukkit.entity.Player");
var UUID = Java.type("java.util.UUID");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Location = Java.type("org.bukkit.Location");
var HashMap = Java.type("java.util.HashMap");
var savedTasks = new HashMap();
var savedTasksPoints = new HashMap();
var cancelledStates = new HashMap();

function CEchangeDestination() {
    try {
        var PathFinder = Java.type("com.destroystokyo.paper.entity.Pathfinder");
    } catch (e) {
        Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: This action is only for Paper and above!");
        return;
    }
    var ChangeDestinationAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {            
            var args = actionLine.split(";");
            if ((args[0].trim().toUpperCase() === "RESET" && args.length < 2) || (args[0].trim().toUpperCase() === "SET" && args.length < 6)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Invalid actionLine format! CORRECT FORMAT: change_destination: <action (SET or RESET)>;<entity_uuid|player_name>;(only in case of SET action) <target_uuid|player_name|world,x,y,z>;(only in case of SET action) <modify_view (true|false)>;(only in case of SET action) <ignore_flying (true|false)>;(only in case of SET action) <continue_after_stop (true|false)>;(optional, only in case of SET action) <speed>");
                return;
            }

            var entity = null;
            try {
                entity = Bukkit.getEntity(UUID.fromString(args[1]));
            } catch (e) {
                entity = Bukkit.getPlayer(args[1]);
            }
            
            if (!entity) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Entity or player not found: " + args[1]);
                return;
            }
            
            function sameBlock(a, b) {
                return a.getWorld().equals(b.getWorld())
                    && Math.abs(a.getX() - b.getX()) < 0.5
                    && Math.abs(a.getY() - b.getY()) < 0.5
                    && Math.abs(a.getZ() - b.getZ()) < 0.5;
            }
                        
            var action = args[0].trim().toUpperCase();
            if (action === "SET") {
                var changeView = args[3].trim().toLowerCase() === "true";
                var ignoreFly = args[4].trim().toLowerCase() === "true";
                var stopContinue = args[5].trim().toLowerCase() === "true";
                var speed = parseFloat(args[6]);
            }
            
            var scheduler = Bukkit.getScheduler();
            var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");
            if (entity instanceof Mob) {
                var pathFinder = entity.getPathfinder();
                switch (action) {
                    case "SET":
                        var target = null;
                        var rawLoc = args[2].split(",");
                        var world = Bukkit.getWorld(rawLoc[0]);
                        var x = parseFloat(rawLoc[1]);
                        var y = parseFloat(rawLoc[2]);
                        var z = parseFloat(rawLoc[3]);

                        if (world && !isNaN(x) && !isNaN(y) && !isNaN(z)) target = new Location(world, x, y, z);
                        else {
                            try {
                                target = Bukkit.getEntity(UUID.fromString(args[2]));
                            } catch (e) {
                                target = Bukkit.getPlayer(args[2]);
                            }
                        }

                        if (!target) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Target entity or location not found: " + args[2]);
                            return;
                        }

                        if (!(target instanceof LivingEntity) && !(target instanceof Location)) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Target entity is not a LivingEntity!");
                            return;
                        }
                        
                        var CONTINUE = stopContinue;
                        var MAX_STUCK_TICKS = 50;
                        var FINISH_THRESHOLD = 0.5;

                        pathFinder.stopPathfinding();

                        if (CONTINUE) {
                            var lastDist = Infinity;
                            var stuckTicks = 0;
                            var idTask = scheduler.scheduleSyncRepeatingTask(plugin, new java.lang.Runnable({
                                run: function () {
                                    if (entity.isDead() || !entity.isValid()) {
                                        scheduler.cancelTask(idTask);
                                        return;
                                    }

                                    var curr = entity.getLocation().toVector();
                                    var tgt = target instanceof Location ? target.toVector() : target.getLocation().toVector();
                                    var dx = curr.getX() - tgt.getX();
                                    var dy = curr.getY() - tgt.getY();
                                    var dz = curr.getZ() - tgt.getZ();
                                    var distSq = dx*dx + dy*dy + dz*dz;

                                    if (distSq < FINISH_THRESHOLD * FINISH_THRESHOLD) {
                                        scheduler.cancelTask(idTask);
                                        savedTasks.remove(entity.getUniqueId());
                                        pathFinder.stopPathfinding();
                                        return;
                                    }

                                    var path = pathFinder.getCurrentPath();
                                    if (!path) {
                                        pathFinder.moveTo(target, speed);
                                        lastDist = Infinity;
                                        stuckTicks = 0;
                                        return;
                                    }

                                    if (distSq >= lastDist - 1e-4) {
                                        stuckTicks++;
                                    } else {
                                        stuckTicks = 0;
                                    }
                                    lastDist = distSq;

                                    if (stuckTicks >= MAX_STUCK_TICKS) {
                                        scheduler.cancelTask(idTask);
                                        pathFinder.stopPathfinding();
                                        return;
                                    }
                                }
                            }), 1, 1);
                            if (idTask !== -1) {
                                savedTasks.put(entity.getUniqueId(), idTask);
                            }
                        } else {
                            if (speed && !isNaN(speed)) pathFinder.moveTo(target, speed);
                            else pathFinder.moveTo(target);
                        }
                        break;
                    case "RESET":
                        var taskId = savedTasks.remove(entity.getUniqueId());
                        if (taskId != null) scheduler.cancelTask(taskId);
                        pathFinder.stopPathfinding();
                        break;
                    default:
                        Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Invalid action.");
                        return;
                }
            } else {
				var Vector = Java.type('org.bukkit.util.Vector');
                
                function saveData(tasksMap, pointsMap) {
                    var file = new java.io.File("plugins/TriggerReactor/tasks.json");

                    var json = {
                        SavedTasks: {}
                    };

                    var tasksEntries = tasksMap.entrySet().iterator();
                    while (tasksEntries.hasNext()) {
                        var entry = tasksEntries.next();
                        var uuid = entry.getKey();
                        var task = entry.getValue();
                        json.SavedTasks[uuid] = task;
                    }

                    var pointsEntries = pointsMap.entrySet().iterator();
                    var pointsObj = {};
                    while (pointsEntries.hasNext()) {
                        var entry = pointsEntries.next();
                        var uuid = entry.getKey();
                        var point = entry.getValue();
                        pointsObj[uuid] = point;
                    }

                    if (Object.keys(pointsObj).length > 0) {
                        json.SavedTasks.Points = pointsObj;
                    }

                    var writer = new java.io.BufferedWriter(new java.io.FileWriter(file));
                    writer.write(JSON.stringify(json, null, 2));
                    writer.close();
                }
                
                switch (action) {
                    case "SET":
                        var target = null;
                        var rawLoc = args[2].split(",");
                        var world = Bukkit.getWorld(rawLoc[0]);
                        var x = parseFloat(rawLoc[1]);
                        var y = parseFloat(rawLoc[2]);
                        var z = parseFloat(rawLoc[3]);

                        if (world && !isNaN(x) && !isNaN(y) && !isNaN(z)) target = new Location(world, x, y, z);
                        else {
                            try {
                                target = Bukkit.getEntity(UUID.fromString(args[2]));
                            } catch (e) {
                                target = Bukkit.getPlayer(args[2]);
                            }
                        }

                        if (!target) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Target entity or location not found: " + args[2]);
                            return;
                        }
                        
                        var savedPoints = null;
                        var stuckCount = 0;
                        var lastStuckLocation = null;
                            
                        function followPath(plugin, targetEntity, pathPoints, velocitySpeed, changeView, ignoreFly) {
                            if (!velocitySpeed || isNaN(velocitySpeed) || velocitySpeed <= 0) velocitySpeed = 0.2;

                            var points = new java.util.ArrayList(pathPoints);
                            savedPoints = pathPoints;
                            if (!points.isEmpty()) points.remove(0);

                            var progressDistanceSq = null;
                            var progressCheckTicks = 0;

                            var strafeActive = false;
                            var strafeCooldown = 0;
                            var strafeDirection = 1;

                            var stuckRecoveryStep = 0;
                            
                            var jumpTicks = 0;

                            var taskId = scheduler.scheduleSyncRepeatingTask(plugin, new java.lang.Runnable({
                                run: function () {
                                    var uuid = targetEntity.getUniqueId().toString();
                                    if (targetEntity.isDead() || !targetEntity.isValid()
                                        || (targetEntity.isOnline && !targetEntity.isOnline())) {
                                        scheduler.cancelTask(taskId);
                                        savedTasks.remove(uuid);
                                        savedTasksPoints.remove(uuid);
                                        saveData(savedTasks, savedTasksPoints);
                                        return;
                                    }

                                    if (points.isEmpty()) {
                                        var stopVel = targetEntity.getVelocity();
                                        targetEntity.setVelocity(new Vector(0.0, stopVel.getY(), 0.0));
                                        scheduler.cancelTask(taskId);
                                        savedTasks.remove(uuid);
                                        savedTasksPoints.remove(uuid);
                                        saveData(savedTasks, savedTasksPoints);
                                        start();
                                        return;
                                    }

                                    var currLoc = targetEntity.getLocation();
                                    var nextLoc = points.get(0);
                                    if (!currLoc.getWorld().equals(nextLoc.getWorld())) {
                                        scheduler.cancelTask(taskId);
                                        savedTasks.remove(uuid);
                                        savedTasksPoints.remove(uuid);
                                        saveData(savedTasks, savedTasksPoints);
                                        return;
                                    }

                                    var dx = currLoc.getX() - nextLoc.getX();
                                    var dz = currLoc.getZ() - nextLoc.getZ();
                                    var horizontalDistanceSq = dx*dx + dz*dz;

                                    var removalThreshold = Math.min(
                                        velocitySpeed < 0.1
                                            ? 0.2 * (0.1 / velocitySpeed)
                                            : velocitySpeed * velocitySpeed * 6.25,
                                        1.0
                                    );

                                    if (horizontalDistanceSq < removalThreshold) {
                                        points.remove(0);
                                        progressDistanceSq = null;
                                        progressCheckTicks = 0;
                                        strafeActive = false;
                                        strafeCooldown = 0;
                                        stuckRecoveryStep = 0;
                                        return;
                                    }

                                    if (!strafeActive) {
                                        if (progressDistanceSq === null || horizontalDistanceSq < progressDistanceSq - 1e-5) {
                                            progressDistanceSq = horizontalDistanceSq;
                                            progressCheckTicks = 0;
                                        } else {
                                            progressCheckTicks++;
                                        }
                                    } else {
                                        progressCheckTicks++;
                                    }

                                    if (progressCheckTicks >= 50) {
                                        scheduler.cancelTask(taskId);
                                        savedTasks.remove(uuid);
                                        savedTasksPoints.remove(uuid);
                                        saveData(savedTasks, savedTasksPoints);

                                        if (lastStuckLocation && sameBlock(currLoc, lastStuckLocation)) {
                                            stuckCount++;
                                        } else {
                                            stuckCount = 0;
                                            lastStuckLocation = currLoc.clone();
                                        }

                                        if (stuckCount >= 3) {
                                            return;
                                        }

                                        start();
                                        return;
                                    }

                                    var dir = nextLoc.toVector().subtract(currLoc.toVector());
                                    var dy = nextLoc.getY() - currLoc.getY();
                                    dir.setY(0);

                                    var vy = targetEntity.getVelocity().getY();
                                    var jumpBoost = false;

                                    var fly = ignoreFly && ((targetEntity.isFlying && targetEntity.isFlying()) || (!targetEntity.isFlying && targetEntity.getLocation().clone().add(0, -1, 0).getBlock().getType().toString() === "AIR"));
                                    if (dy > 0.5 && (fly || targetEntity.isOnGround())) {
                                        vy = 0.36;
                                        jumpBoost = true;
                                        jumpTicks = 3;
                                    } else if (dy < -0.5 && fly) {
                                        vy = Math.min(vy, -0.30);
                                    }
                                    
                                    if (jumpTicks > 0) {
                                        vy = Math.max(vy, 0.24);
                                        jumpTicks--;
                                    } else dir.normalize().multiply(velocitySpeed);

                                    var STRAFE = 0.85;
                                    var doStrafe = (progressCheckTicks > 6 && progressCheckTicks % 4 === 0 && strafeCooldown === 0);

                                    if (jumpBoost) dir.normalize().multiply(Math.max(velocitySpeed * 1.6, 0.3));
                                    else dir.normalize().multiply(velocitySpeed);

                                    if (doStrafe) {
                                        strafeActive = true;
                                        switch (stuckRecoveryStep % 3) {
                                            case 0:
                                                var side = new Vector(-dir.getZ(), 0.0, dir.getX())
                                                    .normalize()
                                                    .multiply(STRAFE * strafeDirection);
                                                dir.add(side);
                                                strafeDirection *= -1;
                                                break;
                                            case 1:
                                                var back = dir.clone().normalize().multiply(-0.6);
                                                dir = back;
                                                break;
                                            case 2:
                                                vy = Math.max(vy, 0.39);
                                                dir.normalize().multiply(Math.max(velocitySpeed * 1.6, 0.3));
                                                break;
                                        }
                                        stuckRecoveryStep++;
                                        strafeCooldown = 15;
                                    }

                                    if (strafeActive) {
                                        if (strafeCooldown > 0) {
                                            strafeCooldown--;
                                        } else {
                                            strafeActive = false;
                                        }
                                    }

                                    dir.setY(vy);
                                    targetEntity.setVelocity(dir);

                                    if (changeView && dir.lengthSquared() > 1e-4) {
                                        var yaw = Math.atan2(-dir.getX(), dir.getZ()) * 180.0 / Math.PI;
                                        try {
                                            targetEntity.setRotation(yaw, currLoc.getPitch());
                                        } catch (e) {
                                            var loc = currLoc.clone();
                                            loc.setYaw(yaw);
                                            targetEntity.teleport(loc);
                                        }
                                    }
                                }
                            }), 1, 1);

                            return taskId;
                        }
                        
                        function start() {
                            var location = entity.getLocation();
                            var ent = location.getWorld().spawn(location, Java.type('org.bukkit.entity.Zombie').class, function (e) { e.setInvisible(true); e.setVisibleByDefault(false); e.setInvulnerable(true); });

                            var pathFinder = ent.getPathfinder();

                            scheduler.runTaskLater(plugin, new java.lang.Runnable({
                                run: function () {
                                    try {
                                        var path = pathFinder.findPath(target).getPoints();
                                        ent.remove();
                                        var uuid = entity.getUniqueId().toString();
                                        scheduler.cancelTask(savedTasks.remove(uuid));
                                        if (!cancelledStates.getOrDefault(uuid, false) && (!savedPoints || !sameBlock(savedPoints.get(savedPoints.size()-1), path.get(path.size()-1)) || !sameBlock(entity.getLocation(), path.get(path.size()-1)))) {
                                            savedTasks.put(uuid, followPath(plugin, entity, path, speed, changeView, ignoreFly, stuckCount));
                                            var locList = [];
                                            for (var i = 0; i < path.size(); i++) {
                                                var loc = path.get(i);
                                                locList.push({
                                                    world: loc.getWorld().getName(),
                                                    x: loc.getX(),
                                                    y: loc.getY(),
                                                    z: loc.getZ(),
                                                    pitch: loc.getPitch(),
                                                    yaw: loc.getYaw()
                                                });
                                            }
                                            savedTasksPoints.put(uuid, locList);
                                            saveData(savedTasks, savedTasksPoints);
                                        }
                                    } catch (e) {}
                                }
                            }), 10);
                        }
                        
                        cancelledStates.remove(entity.getUniqueId().toString());
                        start();
                        break;
                    case "RESET":
                        var uuid = entity.getUniqueId().toString();
                        cancelledStates.put(savedTasks.get(uuid), true);
                        scheduler.cancelTask(savedTasks.remove(uuid));
                        savedTasksPoints.remove(uuid);
                        saveData(savedTasks, savedTasksPoints);
                        break;
                    default:
                        Bukkit.getLogger().warning("[CEActions] CHANGE_DESTINATION ACTION: Invalid action.");
                        return;
                }
            }
        }
    });

    var changeDestinationInstance = new ChangeDestinationAction("change_destination");

    return changeDestinationInstance;
}

CEchangeDestination();