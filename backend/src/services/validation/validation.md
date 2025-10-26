# Field Validation

Validates incoming form data before processing.

## Flow

```mermaid
sequenceDiagram
    participant Manager
    participant Validator as FieldValidator

    Manager->>Validator: validate(formData)

    Validator->>Validator: Validate brandName
    Note over Validator: Required, string, 1-200 chars

    Validator->>Validator: Validate productType
    Note over Validator: Required, string, 1-200 chars

    Validator->>Validator: Validate alcoholContent
    Note over Validator: Required, number, 0-100

    Validator->>Validator: Validate netContents (optional)
    Note over Validator: Both value & unit required together<br/>Value > 0<br/>Unit: ml, cl, L, fl oz, gal

    alt any validation fails
        Validator-->>Manager: throw HttpError(400)
    else all valid
        Validator->>Manager: void (success)
    end
```

## Rules

### Brand Name
- Required, string, 1-200 chars (trimmed)

### Product Type
- Required, string, 1-200 chars (trimmed)

### Alcohol Content
- Required, number, 0-100

### Net Contents
- Optional (both value and unit together)
- Value: number > 0
- Unit: `ml`, `cl`, `L`, `fl oz`, `gal`
- If one provided, both required

## Errors

Returns HTTP 400 with specific validation message.