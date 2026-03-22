import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  // Old BarcodeSeries type (same as new, but not in a record)
  type OldActor = {
    seriesStore : Map.Map<Nat, {
      id : Nat;
      name : Text;
      format : Text;
      values : [Text];
      createdAt : Int;
    }>;
    var nextId : Nat;
  };

  // New BarcodeSeries record type
  type BarcodeSeries = {
    id : Nat;
    name : Text;
    format : Text;
    values : [Text];
    createdAt : Int;
  };

  // New user data type
  type UserData = {
    seriesStore : Map.Map<Nat, BarcodeSeries>;
    var nextSeriesId : Nat;
    var settings : ?Text;
  };

  type NewActor = {
    userStores : Map.Map<Principal, UserData>;
  };

  public func run(old : OldActor) : NewActor {
    let userStores = Map.empty<Principal, UserData>();
    { userStores };
  };
};
