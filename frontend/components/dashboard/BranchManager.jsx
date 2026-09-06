import { useState } from "react";
export default function BranchManager({ branches, onAdd, onDelete, onClose, }) {
    const [name, setName] = useState("");
    function submit(event) {
        event.preventDefault();
        if (!name.trim())
            return;
        onAdd(name.trim());
        setName("");
    }
    return (<div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal branch-modal">
        <div className="modal-title">
          <div>
            <p className="eyebrow">إعداد الأكاديمية</p>
            <h2>إدارة الفروع</h2>
          </div>
          <button type="button" className="close" onClick={onClose}>
            ×
          </button>
        </div>
        <p className="muted">
          أضف عدد الصالات وأسماءها، وستظهر تلقائيًا عند تسجيل أي لاعب.
        </p>
        <form className="branch-form" onSubmit={submit}>
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="اسم الفرع، مثال: صالة أكتوبر"/>
          <button className="primary-button" type="submit">
            إضافة
          </button>
        </form>
        <div className="branch-list">
          {branches.length === 0 ? (<p className="muted">لم تتم إضافة فروع بعد.</p>) : (branches.map((branch) => (<div className="branch-item" key={branch._id}>
                <span>⌂</span>
                <strong>{branch.name}</strong>
                <button className="delete-branch" onClick={() => onDelete(branch.name)} title="حذف الفرع">
                  حذف
                </button>
              </div>)))}
        </div>
      </div>
    </div>);
}
