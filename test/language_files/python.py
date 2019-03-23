class PartnerRelationshipForm(forms.ModelForm):
  class Meta:
    model = PartnerRelationship
    fields = '__all__'

  def __init__(self, *args, **kwargs):
    super().__init__(*args, **kwargs)
    self.fields['partner_class'].queryset = PartnerClass.objects.filter(event=self.instance.event)
    # TODO - show partner name instead of ID -> somehow make PartnerWidget work
    self.fields['partner'].widget = TextInput(attrs={'readonly': 'readonly'})
