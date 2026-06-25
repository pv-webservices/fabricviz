function TestimonialsEditor({ data, onChange, onUpload, generateId, collections }: any) {
  const addTestimonial = () => {
    onChange({
      ...data,
      testimonials: [...(data.testimonials || []), { id: generateId(), author_photo_url: '', author_name: '', author_role: '', author_company: '', quote: '', rating: 5 }]
    });
  };

  const updateTestimonial = (id: string, updates: any) => {
    onChange({
      ...data,
      testimonials: (data.testimonials || []).map((item: any) => item.id === id ? { ...item, ...updates } : item)
    });
  };

  const removeTestimonial = (id: string) => {
    onChange({
      ...data,
      testimonials: (data.testimonials || []).filter((item: any) => item.id !== id)
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded border">
        <div className="space-y-2">
          <Label>Tag Label</Label>
          <Input placeholder="e.g. WHAT CLIENTS SAY" value={data.tagLabel || data.tag_label || ''} onChange={e => onChange({ ...data, tag_label: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Section Heading</Label>
          <Input placeholder="e.g. Trusted by Interior Designers" value={data.heading || ''} onChange={e => onChange({ ...data, heading: e.target.value })} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Subheading</Label>
          <Input placeholder="e.g. From bespoke upholstery..." value={data.subheading || ''} onChange={e => onChange({ ...data, subheading: e.target.value })} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Testimonial Cards</Label>
          <Button variant="outline" size="sm" onClick={addTestimonial}><Plus className="h-4 w-4 mr-2"/> Add Testimonial</Button>
        </div>
        {(!data.testimonials || data.testimonials.length === 0) ? (
          <p className="text-sm text-muted-foreground">No testimonials added.</p>
        ) : (
          <SortableList
            items={data.testimonials}
            onReorder={(newItems) => onChange({ ...data, testimonials: newItems })}
            renderItem={(item: any) => (
              <div className="flex gap-4 w-full flex-col md:flex-row items-start bg-white p-4 border rounded shadow-sm">
                <div className="w-full md:w-32 space-y-2 shrink-0 text-center">
                  <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full border overflow-hidden flex items-center justify-center">
                    {item.author_photo_url ? (
                      <img src={getImageUrl(item.author_photo_url)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <Input type="file" accept="image/*" className="text-[10px]" onChange={(e) => onUpload(e, (url: string) => updateTestimonial(item.id, { author_photo_url: url }))} />
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <textarea 
                    className="w-full h-24 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-slate-900"
                    placeholder="Testimonial quote..."
                    value={item.quote || ''}
                    onChange={e => updateTestimonial(item.id, { quote: e.target.value })}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Input placeholder="Author Name" value={item.author_name || ''} onChange={e => updateTestimonial(item.id, { author_name: e.target.value })} />
                    <Input placeholder="Role (e.g. Interior Designer)" value={item.author_role || ''} onChange={e => updateTestimonial(item.id, { author_role: e.target.value })} />
                    <Input placeholder="Company (e.g. Studio Verde)" value={item.author_company || ''} onChange={e => updateTestimonial(item.id, { author_company: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Rating (1-5)</Label>
                    <select 
                      className="h-8 rounded-md border border-input bg-background px-2 text-sm"
                      value={item.rating || 5}
                      onChange={e => updateTestimonial(item.id, { rating: parseInt(e.target.value) })}
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                    </select>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500 mt-1 shrink-0" onClick={() => removeTestimonial(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}
