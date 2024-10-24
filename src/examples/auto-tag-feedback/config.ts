export const config = {
  /**
   * Doc type name you want to filter on
   */
  docTypeName: 'Feedback',

  /**
   * A property definition id to update
   * And the list of values with their id and name (value)
   *
   * Disclaimer: This is a complete subjective logic that is up to you to define
   * based on the logic of your auto-tagging system
   *
   * Explanation:
   *
   * The auto tagging system here, will be to set the property "Feedback tag"
   * based on the reporter email.
   */
  propertyDefinitionId:
    'QXR0cmlidXRlU2luZ20YjgwZTIi1mODAwLTQ0ODUtYjdkZC1lMWUxNGI5YzcyNDg=',
  values: [
    {
      id: 'QXR0cmlidXRlVGV4dFZhbHVlXzhkY2I0MDQ0LTlkMDNGY2NC04YWIwLWI5ZmMzNGQ0ZTBlMA==',
      value: 'Mobile',
      customerEmails: ['john@email.com', 'jane@email.com'],
    },
    {
      id: 'QXR0cmlidXRlVGV4dFZhbHVlX2NkMWFkYzk0A1ODQtNGY3NC04YzIwLTM1YmI3NjVhMWQwZQ==',
      value: 'Security',
      customerEmails: ['eric@email.com', 'sara@email.com'],
    },
    {
      id: 'QXR0cmlidXRlVGV4dFZhbHVlXzZmZjUzMTI1LWMWMtNDgxYy1iM2MxLWZkMTQyYjI5OGMyOQ==',
      value: 'Payment',
      customerEmails: ['paul@email.com', 'anne@email.com'],
    },
    {
      id: 'QXR0cmlidXRlVGV4dFZhbHVlXzcwMjQ1MzFiLTMwMzktNiOS1hNDE0LWM5MjExOGU5NGEwNg==',
      value: 'Core',
      customerEmails: ['emil@email.com', 'lucy@email.com'],
    },
  ],
};
