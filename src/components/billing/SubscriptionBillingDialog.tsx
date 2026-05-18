import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import "react-phone-number-input/style.css";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import i18n from "@/i18n/config";

type CountryOption = {
  label: string;
  value: string;
  flag: string;
};

type CityResponse = {
  error: boolean;
  msg: string;
  data: string[];
};

const englishOnly = /^[A-Za-z0-9\s.,'()-]+$/;

function buildFormSchema(t: (key: string) => string) {
  return z.object({
    first_name: z.string().trim().min(1, t("billingDialog.validation.firstNameRequired")),
    last_name: z.string().trim().min(1, t("billingDialog.validation.lastNameRequired")),
    email: z.string().trim().email(t("billingDialog.validation.emailInvalid")),
    phone_number: z
      .string()
      .trim()
      .min(1, t("billingDialog.validation.phoneRequired"))
      .refine((value) => isValidPhoneNumber(value), t("billingDialog.validation.phoneInvalid")),
    street: z.string().trim().min(1, t("billingDialog.validation.streetRequired")),
    postal_code: z.string().trim().min(1, t("billingDialog.validation.postalRequired")),
    country: z.string().trim().length(2, t("billingDialog.validation.countryRequired")),
    city: z
      .string()
      .trim()
      .min(1, t("billingDialog.validation.cityRequired"))
      .regex(englishOnly, t("billingDialog.validation.cityEnglishOnly")),
    state: z
      .string()
      .trim()
      .min(1, t("billingDialog.validation.stateRequired"))
      .regex(englishOnly, t("billingDialog.validation.stateEnglishOnly")),
  });
}

type FormValues = z.infer<ReturnType<typeof buildFormSchema>>;

export type BillingSubmitPayload = {
  country: string;
  promoCode?: string;
  billingData: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    street: string;
    postal_code: string;
    city: string;
    country: string;
    state: string;
    apartment: string;
    floor: string;
    building: string;
    shipping_method: string;
  };
};

type SubscriptionBillingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting: boolean;
  defaultEmail?: string;
  promoCode: string;
  promoError?: string | null;
  onPromoCodeChange: (value: string) => void;
  onSubmit: (payload: BillingSubmitPayload) => Promise<void>;
};

let countryCache: CountryOption[] | null = null;
let countryFetchPromise: Promise<CountryOption[]> | null = null;

async function fetchCountries(): Promise<CountryOption[]> {
  if (countryCache) return countryCache;
  if (!countryFetchPromise) {
    countryFetchPromise = fetch("https://restcountries.com/v3.1/all?fields=name,cca2,flags")
      .then(async (response) => {
        if (!response.ok) throw new Error(i18n.t("billing:billingDialog.errors.countriesLoadFailed"));
        const raw = (await response.json()) as Array<{
          name?: { common?: string };
          cca2?: string;
          flags?: { png?: string };
        }>;
        const mapped = raw
          .map((country) => ({
            label: String(country.name?.common || "").trim(),
            value: String(country.cca2 || "").trim().toUpperCase(),
            flag: String(country.flags?.png || ""),
          }))
          .filter((country) => country.label && /^[A-Z]{2}$/.test(country.value))
          .sort((a, b) => a.label.localeCompare(b.label));
        countryCache = mapped;
        return mapped;
      })
      .finally(() => {
        countryFetchPromise = null;
      });
  }
  return countryFetchPromise;
}

export function SubscriptionBillingDialog({
  open,
  onOpenChange,
  submitting,
  defaultEmail,
  promoCode,
  promoError,
  onPromoCodeChange,
  onSubmit,
}: SubscriptionBillingDialogProps) {
  const { t } = useTranslation(["billing", "common"]);
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [countryError, setCountryError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    clearErrors,
    formState: { errors, isValid, isSubmitting: formSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      first_name: "",
      last_name: "",
      email: defaultEmail || "",
      phone_number: "",
      street: "",
      postal_code: "",
      country: "",
      city: "",
      state: "",
    },
  });

  const selectedCountryCode = watch("country");

  useEffect(() => {
    if (!open) return;
    setCountriesLoading(true);
    setCountryError(null);
    void fetchCountries()
      .then((items) => setCountries(items))
      .catch((error: unknown) => {
        setCountryError(
          error instanceof Error ? error.message : t("billingDialog.errors.countriesLoadFailed"),
        );
      })
      .finally(() => setCountriesLoading(false));
  }, [open, t]);

  useEffect(() => {
    if (!open) {
      setCities([]);
      reset({
        first_name: "",
        last_name: "",
        email: defaultEmail || "",
        phone_number: "",
        street: "",
        postal_code: "",
        country: "",
        city: "",
        state: "",
      });
      return;
    }
    if (defaultEmail) {
      setValue("email", defaultEmail);
    }
  }, [open, defaultEmail, reset, setValue]);

  const countryNameByCode = useMemo(
    () => new Map(countries.map((country) => [country.value, country.label])),
    [countries]
  );

  useEffect(() => {
    if (!selectedCountryCode) {
      setCities([]);
      setValue("city", "");
      return;
    }
    const selectedCountryName = countryNameByCode.get(selectedCountryCode);
    if (!selectedCountryName) return;

    setCitiesLoading(true);
    setCities([]);
    setValue("city", "");
    void fetch("https://countriesnow.space/api/v0.1/countries/cities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: selectedCountryName }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(t("billingDialog.errors.citiesLoadFailed"));
        const data = (await response.json()) as CityResponse;
        if (data.error || !Array.isArray(data.data)) {
          throw new Error(data.msg || t("billingDialog.errors.invalidCitiesResponse"));
        }
        const englishCities = data.data
          .filter((city) => englishOnly.test(city))
          .sort((a, b) => a.localeCompare(b));
        setCities(englishCities);
      })
      .catch(() => {
        setCities([]);
      })
      .finally(() => setCitiesLoading(false));
  }, [selectedCountryCode, setValue, countryNameByCode, t]);

  const submitHandler = handleSubmit(async (values) => {
    const normalizedCountry = values.country.toUpperCase();
    const parsedPhone = parsePhoneNumberFromString(values.phone_number);
    const normalizedPhone = parsedPhone?.number || values.phone_number;

    const payload: BillingSubmitPayload = {
      country: normalizedCountry,
      ...(promoCode.trim() ? { promoCode: promoCode.trim() } : {}),
      billingData: {
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim(),
        phone_number: normalizedPhone,
        street: values.street.trim(),
        postal_code: values.postal_code.trim(),
        city: values.city.trim(),
        country: normalizedCountry,
        state: values.state.trim(),
        apartment: "NA",
        floor: "NA",
        building: "NA",
        shipping_method: "PKG",
      },
    };

    console.log("Subscription billing payload", payload);
    await onSubmit(payload);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t("billingDialog.title")}</DialogTitle>
          <DialogDescription>{t("billingDialog.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submitHandler} className="px-6 pb-6">
          <div className="max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 p-4">
              <Field label={t("billingDialog.firstName")} error={errors.first_name?.message}>
                <Input {...register("first_name")} placeholder={t("billingDialog.placeholderFirstName")} />
              </Field>

              <Field label={t("billingDialog.lastName")} error={errors.last_name?.message}>
                <Input {...register("last_name")} placeholder={t("billingDialog.placeholderLastName")} />
              </Field>

              <Field label={t("common:labels.email")} error={errors.email?.message}>
                <Input {...register("email")} type="email" placeholder={t("billingDialog.placeholderEmail")} />
              </Field>

              <Field label={t("billingDialog.phoneNumber")} error={errors.phone_number?.message}>
                <Controller
                  control={control}
                  name="phone_number"
                  render={({ field }) => (
                    <PhoneInput
                      international
                      defaultCountry="EG"
                      value={field.value}
                      onChange={(value) => field.onChange(value || "")}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  )}
                />
              </Field>

              <Field label={t("billingDialog.street")} error={errors.street?.message}>
                <Input {...register("street")} placeholder={t("billingDialog.placeholderStreet")} />
              </Field>

              <Field label={t("billingDialog.postalCode")} error={errors.postal_code?.message}>
                <Input {...register("postal_code")} placeholder={t("billingDialog.placeholderPostalCode")} />
              </Field>

              <Field label={t("billingDialog.country")} error={errors.country?.message || countryError || undefined}>
                <Select
                  value={selectedCountryCode}
                  onValueChange={(value) => {
                    setValue("country", value, { shouldValidate: true, shouldDirty: true });
                    clearErrors("country");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        countriesLoading ? t("billingDialog.loadingCountries") : t("billingDialog.selectCountry")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.value} value={country.value}>
                        <span className="inline-flex items-center gap-2">
                          {country.flag ? (
                            <img src={country.flag} alt="" className="h-3.5 w-5 rounded-sm object-cover" />
                          ) : null}
                          <span>{country.label}</span>
                          <span className="text-muted-foreground">({country.value})</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("billingDialog.city")} error={errors.city?.message}>
                <Select
                  value={watch("city")}
                  onValueChange={(value) => setValue("city", value, { shouldValidate: true, shouldDirty: true })}
                  disabled={!selectedCountryCode || citiesLoading || cities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedCountryCode
                          ? t("billingDialog.selectCountryFirst")
                          : citiesLoading
                            ? t("billingDialog.loadingCities")
                            : t("billingDialog.selectCity")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("billingDialog.state")} error={errors.state?.message}>
                <Select
                  value={watch("state")}
                  onValueChange={(value) => setValue("state", value, { shouldValidate: true, shouldDirty: true })}
                  disabled={!selectedCountryCode || citiesLoading || cities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedCountryCode
                          ? t("billingDialog.selectCountryFirst")
                          : citiesLoading
                            ? t("billingDialog.loadingStates")
                            : t("billingDialog.selectState")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={`state-${city}`} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("billingDialog.promoCode")} error={promoError || undefined}>
                <Input
                  value={promoCode}
                  onChange={(event) => onPromoCodeChange(event.target.value)}
                  placeholder={t("billingDialog.placeholderPromo")}
                />
              </Field>
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting || formSubmitting}>
              {t("common:actions.cancel")}
            </Button>
            <Button type="submit" className="gradient-primary" disabled={!isValid || submitting || formSubmitting || countriesLoading || citiesLoading}>
              {submitting || formSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("billingDialog.continueToPayment")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
