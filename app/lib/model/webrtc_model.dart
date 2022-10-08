class WebRTCModel {
  String? from;
  String? to;
  String? offerSDP;
  String? offerType;
  String? answerSDP;
  String? answerType;
  bool? audioOnly;

  WebRTCModel({
    this.from,
    this.to,
    this.offerSDP,
    this.offerType,
    this.answerSDP,
    this.answerType,
    this.audioOnly,
  });

  factory WebRTCModel.fromJson(Map json) {
    return WebRTCModel(
        from: json['from'],
        to: json['to'],
        offerSDP: json['offerSDP'],
        offerType: json['offerType'],
        answerSDP: json['answerSDP'],
        answerType: json['answerType'],
        audioOnly: json['audioOnly']);
  }

  Map<String, dynamic> toJson() {
    return {
      'from': from,
      'to': to,
      'offerSDP': offerSDP,
      'offerType': offerType,
      'answerSDP': answerSDP,
      'answerType': answerType,
      'audioOnly': audioOnly
    };
  }
}
