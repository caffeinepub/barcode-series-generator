import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Migration "migration";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

(with migration = Migration.run)
actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  public type UserProfile = {
    name : Text;
  };

  type BarcodeSeries = {
    id : Nat;
    name : Text;
    format : Text;
    values : [Text];
    createdAt : Int;
  };

  type UserData = {
    seriesStore : Map.Map<Nat, BarcodeSeries>;
    var nextSeriesId : Nat;
    var settings : ?Text;
  };

  let userStores = Map.empty<Principal, UserData>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  func getOrInitializeUserData(user : Principal) : UserData {
    switch (userStores.get(user)) {
      case (null) {
        let newUserData : UserData = {
          seriesStore = Map.empty<Nat, BarcodeSeries>();
          var nextSeriesId = 0;
          var settings = null;
        };
        userStores.add(user, newUserData);
        newUserData;
      };
      case (?userData) { userData };
    };
  };

  // User profile functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Barcode series functions
  public query ({ caller }) func getSeries(id : Nat) : async BarcodeSeries {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let callerData = getOrInitializeUserData(caller);
    switch (callerData.seriesStore.get(id)) {
      case (null) { Runtime.trap("Series not found") };
      case (?series) { series };
    };
  };

  public query ({ caller }) func listSeries() : async [BarcodeSeries] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    getOrInitializeUserData(caller).seriesStore.values().toArray();
  };

  public shared ({ caller }) func createSeries(name : Text, format : Text, values : [Text]) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let callerData = getOrInitializeUserData(caller);
    let id = callerData.nextSeriesId;
    let series : BarcodeSeries = {
      id;
      name;
      format;
      values;
      createdAt = Time.now();
    };
    callerData.seriesStore.add(id, series);
    callerData.nextSeriesId += 1;
    id;
  };

  public shared ({ caller }) func deleteSeries(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let callerData = getOrInitializeUserData(caller);
    if (not callerData.seriesStore.containsKey(id)) {
      Runtime.trap("Series not found");
    };
    callerData.seriesStore.remove(id);
  };

  public shared ({ caller }) func renameSeries(id : Nat, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    let callerData = getOrInitializeUserData(caller);
    switch (callerData.seriesStore.get(id)) {
      case (null) { Runtime.trap("Series not found") };
      case (?series) {
        let updatedSeries : BarcodeSeries = {
          id = series.id;
          name = newName;
          format = series.format;
          values = series.values;
          createdAt = series.createdAt;
        };
        callerData.seriesStore.add(id, updatedSeries);
      };
    };
  };

  // User settings functions
  public shared ({ caller }) func saveUserSettings(settings : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    getOrInitializeUserData(caller).settings := ?settings;
  };

  public query ({ caller }) func getUserSettings() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };
    getOrInitializeUserData(caller).settings;
  };

  // Admin functions
  public query ({ caller }) func getAllSeriesCount() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    var count = 0;
    for (userData in userStores.values()) {
      count += userData.seriesStore.size();
    };
    count;
  };

  public query ({ caller }) func getAllSeriesByUser() : async [(Principal, [BarcodeSeries])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    userStores.entries().map<(Principal, UserData), (Principal, [BarcodeSeries])>(
      func((principal, data)) { (principal, data.seriesStore.values().toArray()) }
    ).toArray();
  };
};
