-- PostgreSQL delivers NOTIFY only after the surrounding invoice/payment change commits.
CREATE OR REPLACE FUNCTION notify_dashboard_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM pg_notify('dashboard_changed', TG_TABLE_NAME);
  RETURN NULL;
END;
$$;

CREATE TRIGGER invoices_dashboard_changed
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH STATEMENT
EXECUTE FUNCTION notify_dashboard_change();

CREATE TRIGGER payments_dashboard_changed
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH STATEMENT
EXECUTE FUNCTION notify_dashboard_change();
