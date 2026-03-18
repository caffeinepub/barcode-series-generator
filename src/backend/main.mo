import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";

actor {
  type BarcodeSeries = {
    id : Nat;
    name : Text;
    format : Text;
    values : [Text];
    createdAt : Int;
  };

  let seriesStore = Map.empty<Nat, BarcodeSeries>();
  var nextId = 0;

  public shared ({ caller }) func createSeries(name : Text, format : Text, values : [Text]) : async Nat {
    let id = nextId;
    let series : BarcodeSeries = {
      id;
      name;
      format;
      values;
      createdAt = Time.now();
    };
    seriesStore.add(id, series);
    nextId += 1;
    id;
  };

  public query ({ caller }) func getSeries(id : Nat) : async BarcodeSeries {
    switch (seriesStore.get(id)) {
      case (null) { Runtime.trap("Series not found") };
      case (?series) { series };
    };
  };

  public query ({ caller }) func listSeries() : async [BarcodeSeries] {
    seriesStore.values().toArray();
  };

  public shared ({ caller }) func deleteSeries(id : Nat) : async () {
    if (not seriesStore.containsKey(id)) {
      Runtime.trap("Series not found");
    };
    seriesStore.remove(id);
  };
};
