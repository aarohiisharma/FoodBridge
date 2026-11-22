import { useEffect, useState } from 'react';
import InputField from './InputField';
import Button from './Button';
import '../styles/components.css';

const EMPTY_FORM = {
  food_name: '',
  food_type: 'COOKED',
  quantity: '',
  quantity_unit: '',
  preparation_time: '',
  expiry_time: '',
  pickup_location: '',
  description: '',
  image_url: '',
};

function toDateTimeLocal(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function DonationForm({ donation = null, onSubmit, onCancel, submitting = false }) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (donation) {
      setValues({
        food_name: donation.food_name || '',
        food_type: donation.food_type || 'COOKED',
        quantity: donation.quantity ?? '',
        quantity_unit: donation.quantity_unit || '',
        preparation_time: toDateTimeLocal(donation.preparation_time),
        expiry_time: toDateTimeLocal(donation.expiry_time),
        pickup_location: donation.pickup_location || '',
        description: donation.description || '',
        image_url: donation.image_url || '',
      });
    } else {
      setValues(EMPTY_FORM);
    }
  }, [donation]);

  function updateField(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  function validate() {
    const nextErrors = {};
    if (!values.food_name.trim()) nextErrors.food_name = 'Food name is required';
    if (!values.quantity || Number(values.quantity) <= 0) {
      nextErrors.quantity = 'Quantity must be positive';
    }
    if (!values.quantity_unit.trim()) nextErrors.quantity_unit = 'Quantity unit is required';
    if (!values.preparation_time) nextErrors.preparation_time = 'Preparation date and time is required';
    if (!values.expiry_time) nextErrors.expiry_time = 'Safe consumption deadline is required';
    if (
      values.preparation_time
      && values.expiry_time
      && new Date(values.expiry_time) <= new Date(values.preparation_time)
    ) {
      nextErrors.expiry_time = 'Expiry time must be later than preparation time';
    }
    if (!values.pickup_location.trim()) {
      nextErrors.pickup_location = 'Pickup address is required';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      ...values,
      quantity: Number(values.quantity),
      preparation_time: new Date(values.preparation_time).toISOString(),
      expiry_time: new Date(values.expiry_time).toISOString(),
      pickup_location: values.pickup_location,
      description: values.description || null,
      image_url: values.image_url || null,
    };
    onSubmit(payload);
  }

  return (
    <form className="donation-form" onSubmit={handleSubmit} noValidate>
      <div className="donation-form__grid">
        <InputField
          label="Food name"
          id="donation-food-name"
          name="food_name"
          value={values.food_name}
          onChange={updateField}
          error={errors.food_name}
          required
        />

        <div className="donation-form__field">
          <label htmlFor="donation-food-category">Food category *</label>
          <select
            id="donation-food-category"
            name="food_type"
            value={values.food_type}
            onChange={updateField}
          >
            <option value="COOKED">Cooked</option>
            <option value="PACKAGED">Packaged</option>
            <option value="RAW">Raw</option>
            <option value="BAKERY">Bakery</option>
            <option value="FRUIT_VEG">Fruit and vegetables</option>
            <option value="DAIRY">Dairy</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <InputField
          label="Quantity"
          id="donation-quantity"
          name="quantity"
          type="number"
          min="0"
          step="any"
          value={values.quantity}
          onChange={updateField}
          error={errors.quantity}
          required
        />
        <InputField
          label="Quantity unit"
          id="donation-quantity-unit"
          name="quantity_unit"
          value={values.quantity_unit}
          onChange={updateField}
          error={errors.quantity_unit}
          required
        />
        <InputField
          label="Preparation date and time"
          id="donation-preparation-time"
          name="preparation_time"
          type="datetime-local"
          value={values.preparation_time}
          onChange={updateField}
          error={errors.preparation_time}
          required
        />
        <InputField
          label="Safe consumption deadline"
          id="donation-expiry-time"
          name="expiry_time"
          type="datetime-local"
          value={values.expiry_time}
          onChange={updateField}
          error={errors.expiry_time}
          required
        />
        <div className="donation-form__full">
          <InputField
            label="Pickup address"
            id="donation-pickup-address"
            name="pickup_location"
            value={values.pickup_location}
            onChange={updateField}
            error={errors.pickup_location}
            required
          />
        </div>
        <div className="donation-form__field donation-form__full">
          <label htmlFor="donation-description">Description</label>
          <textarea
            id="donation-description"
            name="description"
            value={values.description}
            onChange={updateField}
            rows="4"
          />
        </div>
        <div className="donation-form__full">
          <InputField
            label="Food image URL (optional)"
            id="donation-image-url"
            name="image_url"
            type="url"
            value={values.image_url}
            onChange={updateField}
          />
        </div>
      </div>

      <div className="donation-form__actions">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={submitting}>
          {donation ? 'Save changes' : 'Create donation'}
        </Button>
      </div>
    </form>
  );
}

export default DonationForm;
