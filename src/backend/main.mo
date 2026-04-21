import List "mo:core/List";
import TenantTypes "types/tenant";
import PropertyTypes "types/property";
import PaymentTypes "types/payment";
import Ops "types/operations";
import TenantApi "mixins/tenant-api";
import PropertyApi "mixins/property-api";
import PaymentApi "mixins/payment-api";
import OpsApi "mixins/operations-api";
import WhatsAppApi "mixins/whatsapp-api";

actor {
  // Tenant state
  let tenants = List.empty<TenantTypes.Tenant>();
  let nextTenantId = { var val : Nat = 0 };

  // Property state
  let rooms = List.empty<PropertyTypes.Room>();
  let beds = List.empty<PropertyTypes.Bed>();
  let nextRoomId = { var val : Nat = 0 };
  let nextBedId = { var val : Nat = 0 };

  // Payment state
  let payments = List.empty<PaymentTypes.Payment>();
  let nextPaymentId = { var val : Nat = 0 };

  // Operations state
  let complaints = List.empty<Ops.Complaint>();
  let expenses = List.empty<Ops.Expense>();
  let mealRecords = List.empty<Ops.MealRecord>();
  let staffTasks = List.empty<Ops.StaffTask>();
  let parcels = List.empty<Ops.Parcel>();
  let microCharges = List.empty<Ops.MicroCharge>();
  let guestLogs = List.empty<Ops.GuestLog>();

  let nextComplaintId = { var val : Nat = 0 };
  let nextExpenseId = { var val : Nat = 0 };
  let nextMealRecordId = { var val : Nat = 0 };
  let nextStaffTaskId = { var val : Nat = 0 };
  let nextParcelId = { var val : Nat = 0 };
  let nextMicroChargeId = { var val : Nat = 0 };
  let nextGuestLogId = { var val : Nat = 0 };

  // WhatsApp config state
  let whatsappPhoneNumberId = { var val : Text = "" };
  let whatsappAccessToken = { var val : Text = "" };

  include TenantApi(tenants, nextTenantId);
  include PropertyApi(rooms, beds, nextRoomId, nextBedId);
  include PaymentApi(payments, tenants, nextPaymentId);
  include OpsApi(
    complaints,
    expenses,
    mealRecords,
    staffTasks,
    parcels,
    microCharges,
    guestLogs,
    tenants,
    rooms,
    beds,
    payments,
    nextComplaintId,
    nextExpenseId,
    nextMealRecordId,
    nextStaffTaskId,
    nextParcelId,
    nextMicroChargeId,
    nextGuestLogId,
  );
  include WhatsAppApi(whatsappPhoneNumberId, whatsappAccessToken);
};
