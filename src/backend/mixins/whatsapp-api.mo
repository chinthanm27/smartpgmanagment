mixin (
  whatsappPhoneNumberId : { var val : Text },
  whatsappAccessToken : { var val : Text },
) {
  // IC management canister HTTP outcall interface
  type HttpHeader = { name : Text; value : Text };
  type HttpMethod = { #get; #post; #head };
  type TransformContext = { function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse; context : Blob };
  type HttpResponse = { status : Nat; headers : [HttpHeader]; body : Blob };
  type HttpRequest = {
    url : Text;
    max_response_bytes : ?Nat64;
    headers : [HttpHeader];
    body : ?Blob;
    method : HttpMethod;
    transform : ?TransformContext;
  };

  let ic = actor "aaaaa-aa" : actor {
    http_request : HttpRequest -> async HttpResponse;
  };

  public shared func setWhatsAppConfig(phoneNumberId : Text, accessToken : Text) : async Bool {
    if (phoneNumberId.size() == 0 or accessToken.size() == 0) {
      return false;
    };
    whatsappPhoneNumberId.val := phoneNumberId;
    whatsappAccessToken.val := accessToken;
    true;
  };

  public query func getWhatsAppConfigured() : async Bool {
    whatsappPhoneNumberId.val.size() > 0 and whatsappAccessToken.val.size() > 0;
  };

  public shared func sendWhatsAppReminder(
    tenantPhone : Text,
    tenantName : Text,
    amount : Nat,
    month : Text,
  ) : async { ok : Bool; message : Text } {
    if (whatsappPhoneNumberId.val.size() == 0 or whatsappAccessToken.val.size() == 0) {
      return { ok = false; message = "WhatsApp not configured. Please set up your API key in settings." };
    };

    let msgText = "Dear " # tenantName # ", this is a friendly reminder that your rent of \u{20B9}" # amount.toText() # " for " # month # " is due. Please pay at your earliest convenience. - SmartPG";

    let bodyJson = "{\"messaging_product\":\"whatsapp\",\"to\":\"" # tenantPhone # "\",\"type\":\"text\",\"text\":{\"body\":\"" # msgText # "\"}}";

    let url = "https://graph.facebook.com/v18.0/" # whatsappPhoneNumberId.val # "/messages";

    let request : HttpRequest = {
      url = url;
      max_response_bytes = ?2000;
      headers = [
        { name = "Content-Type"; value = "application/json" },
        { name = "Authorization"; value = "Bearer " # whatsappAccessToken.val },
      ];
      body = ?(bodyJson.encodeUtf8());
      method = #post;
      transform = null;
    };

    try {
      let response = await (with cycles = 230_850_258_000) ic.http_request(request);
      if (response.status >= 200 and response.status < 300) {
        { ok = true; message = "WhatsApp reminder sent to " # tenantPhone };
      } else {
        let bodyText = switch (response.body.decodeUtf8()) {
          case (?t) t;
          case null "unknown error";
        };
        { ok = false; message = "WhatsApp API error (status " # response.status.toText() # "): " # bodyText };
      };
    } catch (e) {
      { ok = false; message = "Failed to send WhatsApp message. Check your API configuration." };
    };
  };
};
