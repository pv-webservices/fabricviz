CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin','brand_admin','sales_rep','showroom_user')),
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(5) UNIQUE NOT NULL,
  customer_name TEXT,
  company_name TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  render_count INTEGER DEFAULT 0,
  credit_limit INTEGER DEFAULT 100,
  credits_used INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

CREATE TABLE customer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id UUID REFERENCES access_codes(id),
  token_hash TEXT NOT NULL,
  device_fingerprint TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE collection_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  group_id UUID REFERENCES collection_groups(id),
  end_use TEXT NOT NULL CHECK (end_use IN ('sofa','curtain','rug','wallpaper','both')),
  qr_code TEXT,
  qr_url TEXT,
  active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fabrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  swatch_url TEXT,
  texture_url TEXT,
  color_family TEXT,
  quality TEXT,
  tags TEXT[],
  end_use TEXT NOT NULL CHECK (end_use IN ('sofa','curtain','rug','wallpaper','both')),
  repeat_width_mm NUMERIC,
  repeat_height_mm NUMERIC,
  fabric_width_cm NUMERIC,
  price_inr NUMERIC,
  feature_flags JSONB DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE predefined_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  end_use TEXT NOT NULL CHECK (end_use IN ('sofa','curtain','both')),
  display_order INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE visualizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id UUID REFERENCES access_codes(id),
  fabric_id UUID REFERENCES fabrics(id),
  room_id UUID REFERENCES predefined_rooms(id),
  uploaded_photo_url TEXT,
  object_type TEXT NOT NULL CHECK (object_type IN ('sofa','curtain','rug','wallpaper')),
  source_type TEXT NOT NULL CHECK (source_type IN ('template','predefined_room','upload','camera')),
  before_url TEXT,
  after_url TEXT,
  pdf_url TEXT,
  render_job_id UUID,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE render_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visualization_id UUID REFERENCES visualizations(id),
  queue_job_id TEXT,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','retrying')),
  attempt_count INTEGER DEFAULT 0,
  error_message TEXT,
  provider TEXT DEFAULT 'nano_banana',
  prompt_used TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('access_code_request','quote_request','sample_request')),
  name TEXT,
  company TEXT,
  phone TEXT,
  email TEXT,
  fabric_id UUID REFERENCES fabrics(id),
  visualization_id UUID REFERENCES visualizations(id),
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  handled_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  access_code_id UUID REFERENCES access_codes(id),
  fabric_id UUID REFERENCES fabrics(id),
  collection_id UUID REFERENCES collections(id),
  visualization_id UUID REFERENCES visualizations(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fabrics_collection ON fabrics(collection_id);
CREATE INDEX idx_fabrics_end_use ON fabrics(end_use);
CREATE INDEX idx_visualizations_access_code ON visualizations(access_code_id);
CREATE INDEX idx_analytics_events_created ON analytics_events(created_at);
CREATE INDEX idx_render_jobs_status ON render_jobs(status);

-- Default settings seed
INSERT INTO app_settings (key, value) VALUES
  ('site_name', 'FabricViz AI'),
  ('support_email', ''),
  ('support_whatsapp', ''),
  ('render_mode', 'async'),
  ('storage_mode', 'cloud'),
  ('history_limit', '50'),
  ('tutorial_video_url', '');
